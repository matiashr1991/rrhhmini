import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeLeaveQuota } from './leave-quota.entity';
import { LeaveRequest, LeaveStatus } from './leave-request.entity';

@Injectable()
export class LeaveQuotasService {
    constructor(
        @InjectRepository(EmployeeLeaveQuota)
        private quotaRepository: Repository<EmployeeLeaveQuota>,
        @InjectRepository(LeaveRequest)
        private leaveRepository: Repository<LeaveRequest>,
    ) { }

    async getQuotas(employeeId?: string, year?: number) {
        let qs = this.quotaRepository.createQueryBuilder('quota')
            .leftJoinAndSelect('quota.employee', 'employee')
            .leftJoinAndSelect('quota.leaveType', 'leaveType');

        if (employeeId) qs = qs.where('quota.employeeId = :employeeId', { employeeId });
        if (year) qs = qs.andWhere('quota.year = :year', { year });

        return qs.getMany();
    }

    async upsertQuota(data: { employeeId: string; leaveTypeId: number; year: number; maxDays: number }) {
        let quota = await this.quotaRepository.findOne({
            where: {
                employee: { id: data.employeeId },
                leaveType: { id: data.leaveTypeId },
                year: data.year
            }
        });

        if (quota) {
            quota.maxDays = data.maxDays;
        } else {
            quota = this.quotaRepository.create({
                employee: { id: data.employeeId } as any,
                leaveType: { id: data.leaveTypeId } as any,
                year: data.year,
                maxDays: data.maxDays
            });
        }

        return this.quotaRepository.save(quota);
    }

    /**
     * Returns the remaining days for a given employee, leave type, and year.
     *
     * Priority for annual max:
     *   1. Explicit per-employee quota override (EmployeeLeaveQuota table)
     *   2. LeaveType.maxDaysPerYear  (configured in the ABM)
     *   3. null → unlimited (no limit enforced)
     *
     * Monthly cap: applied when LeaveType.maxDaysPerMonth is set (data-driven, NOT hard-coded).
     */
    async getRemainingDays(employeeId: string, leaveTypeId: number, year: number) {
        // Load leave type (with new configurable fields)
        const leaveType: any = await this.quotaRepository.manager
            .getRepository('LeaveType')
            .findOne({ where: { id: leaveTypeId } });

        // Load employee (in case we ever need seniority-based rules again)
        const employee: any = await this.quotaRepository.manager
            .getRepository('Employee')
            .findOne({ where: { id: employeeId } });

        if (!leaveType || !employee) return null;

        // --- 1. Determine the annual max days ---
        const quota = await this.quotaRepository.findOne({
            where: {
                employee: { id: employeeId },
                leaveType: { id: leaveTypeId },
                year: year
            }
        });

        let maxDays: number | null = null;

        if (quota) {
            // Admin has manually set a quota for this employee/type/year → highest priority
            maxDays = quota.maxDays;
        } else if (leaveType.maxDaysPerYear !== null && leaveType.maxDaysPerYear !== undefined) {
            // Fall back to the type-level default configured in the ABM
            maxDays = leaveType.maxDaysPerYear;
        }

        if (maxDays === null) {
            return null; // No limit → unlimited, skip quota check
        }

        // --- 2. Fetch all active leaves for this employee + type ---
        const leaves = await this.leaveRepository.find({
            where: {
                employee: { id: employeeId },
                type: { id: leaveTypeId },
            }
        });

        let usedDays = 0;
        let usedDaysThisMonth = 0;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        for (const leave of leaves) {
            const startDate = new Date(leave.startDate);
            if (
                startDate.getFullYear() === year &&
                (leave.status === LeaveStatus.APPROVED || leave.status === LeaveStatus.PENDING)
            ) {
                const start = startDate.getTime();
                const end = new Date(leave.endDate).getTime();
                if (end >= start) {
                    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
                    usedDays += diffDays;

                    // Track monthly usage only if a monthly cap is configured
                    if (
                        leaveType.maxDaysPerMonth !== null &&
                        leaveType.maxDaysPerMonth !== undefined &&
                        startDate.getFullYear() === currentYear &&
                        startDate.getMonth() === currentMonth
                    ) {
                        usedDaysThisMonth += diffDays;
                    }
                }
            }
        }

        let remainingDays = maxDays - usedDays;
        let limitReason: string | null = null;

        // --- 3. Apply monthly cap if the type has one configured ---
        if (leaveType.maxDaysPerMonth !== null && leaveType.maxDaysPerMonth !== undefined) {
            const maxPerMonth: number = leaveType.maxDaysPerMonth;
            const remainingThisMonth = maxPerMonth - usedDaysThisMonth;
            if (remainingThisMonth < remainingDays) {
                remainingDays = Math.max(0, remainingThisMonth);
                limitReason = `Mensual (Máx ${maxPerMonth} por mes)`;
            }
        }

        return {
            maxDays,
            usedDays,
            remainingDays,
            limitReason
        };
    }
}
