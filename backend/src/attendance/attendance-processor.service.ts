import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AttendanceEvent } from './attendance-event.entity';
import { DailyAttendance } from './daily-attendance.entity';
import { EmployeesService } from '../employees/employees.service';
import { LeaveRequestsService } from '../leave-requests/leave-requests.service';
import { HolidaysService } from './holidays.service';

@Injectable()
export class AttendanceProcessorService {
    private readonly logger = new Logger(AttendanceProcessorService.name);

    constructor(
        @InjectRepository(AttendanceEvent)
        private eventsRepo: Repository<AttendanceEvent>,
        @InjectRepository(DailyAttendance)
        private dailyRepo: Repository<DailyAttendance>,
        private employeesService: EmployeesService,
        private leaveRequestsService: LeaveRequestsService,
        private holidaysService: HolidaysService,
    ) { }

    async processDay(dateStr: string) {
        this.logger.log(`Processing attendance for ${dateStr}...`);

        // 1. Get all active employees
        const employees = await this.employeesService.findAll();

        // 2. Define day range safely
        // dateStr is YYYY-MM-DD
        const startOfDay = new Date(`${dateStr}T00:00:00.000`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999`);

        for (const emp of employees) {
            // Find existing daily record or create new
            let daily = await this.dailyRepo.findOne({
                where: { employee: { id: emp.id }, date: dateStr },
                relations: ['employee']
            });

            if (!daily) {
                daily = new DailyAttendance();
                daily.employee = emp;
                daily.date = dateStr;
            }

            // Find events for this employee on this day
            const events = await this.eventsRepo.find({
                where: {
                    employee: { id: emp.id },
                    timestamp: Between(startOfDay, endOfDay)
                },
                order: { timestamp: 'ASC' }
            });

            // Check for Approved Leave
            const approvedLeave = await this.leaveRequestsService.getApprovedLeave(emp.id, dateStr);

            if (approvedLeave) {
                // If they have an approved leave, their status is definitively LICENSE
                daily.status = 'LICENSE';
                daily.isAbsent = false;
                daily.meta = { ...daily.meta, leaveTypeId: approvedLeave.type.id, leaveTypeName: approvedLeave.type.name };

                // Track their hours anyway if they inexplicably badged in
                if (events.length > 0) {
                    daily.inTime = events[0].timestamp;
                    daily.outTime = events.length > 1 ? events[events.length - 1].timestamp : null;
                    if (daily.outTime && daily.inTime) {
                        const diffMs = daily.outTime.getTime() - daily.inTime.getTime();
                        daily.hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
                    } else {
                        daily.hoursWorked = 0;
                    }
                } else {
                    daily.inTime = null;
                    daily.outTime = null;
                    daily.hoursWorked = 0;
                }
            } else if (events.length === 0) {
                // No approved leave & no events -> check if holiday, then weekend, then absent
                const holiday = await this.holidaysService.findByDate(dateStr);

                if (holiday) {
                    daily.status = 'HOLIDAY';
                    daily.isAbsent = false;
                    daily.meta = { ...daily.meta, holidayName: holiday.description };
                } else {
                    const dateObj = new Date(dateStr + 'T12:00:00');
                    const day = dateObj.getDay();
                    if (day === 0 || day === 6) { // Sunday or Saturday
                        daily.status = 'OFF';
                        daily.isAbsent = false;
                    } else {
                        daily.status = 'ABSENT';
                        daily.isAbsent = true;
                    }
                }
                daily.inTime = null;
                daily.outTime = null;
                daily.hoursWorked = 0;
            } else {
                // Normal working day
                daily.status = 'PRESENT';
                daily.isAbsent = false;
                daily.inTime = events[0].timestamp;

                // Deduplicate exit punch: Must be at least 10 minutes later than inTime
                let latestValidExit: Date | null = null;
                for (let i = events.length - 1; i > 0; i--) {
                    const timeDiffMs = events[i].timestamp.getTime() - events[0].timestamp.getTime();
                    if (timeDiffMs > 10 * 60 * 1000) { // 10 minutes
                        latestValidExit = events[i].timestamp;
                        break;
                    }
                }

                daily.outTime = latestValidExit;

                // Calculate hours
                if (daily.outTime && daily.inTime) {
                    const diffMs = daily.outTime.getTime() - daily.inTime.getTime();
                    daily.hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
                } else {
                    daily.hoursWorked = 0;
                }
            }

            await this.dailyRepo.save(daily);
        }

        this.logger.log(`Finished processing ${dateStr}`);
    }

    /**
     * Nightly cron: process today's attendance at 23:30
     */
    @Cron('30 23 * * *')
    async handleNightlyProcess() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        this.logger.log(`Nightly cron: processing ${todayStr}...`);
        await this.processDay(todayStr);
    }

    /**
     * Overnight cron: reprocess yesterday at 00:30 to catch late events
     */
    @Cron('30 0 * * *')
    async handleOvernightReprocess() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const year = yesterday.getFullYear();
        const month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getDate()).padStart(2, '0');
        const yStr = `${year}-${month}-${day}`;
        this.logger.log(`Overnight cron: reprocessing ${yStr}...`);
        await this.processDay(yStr);
    }

    async getDailyReport(dateStr: string) {
        return this.dailyRepo.find({
            where: { date: dateStr },
            relations: ['employee'],
            order: { employee: { lastName: 'ASC' } }
        });
    }

    async getMonthlyAttendance(startStr: string, endStr: string) {
        return this.dailyRepo.find({
            where: {
                date: Between(startStr, endStr)
            },
            relations: ['employee'],
            order: { date: 'ASC' }
        });
    }
}
