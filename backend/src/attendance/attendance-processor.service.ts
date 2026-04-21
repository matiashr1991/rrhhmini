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
        this.logger.log(`Processing attendance for ${dateStr} (Batch mode)...`);

        const employees = await this.employeesService.findAll();
        
        // Define local day range (handled by server's America/Argentina/Buenos_Aires TZ)
        // We use the exact format that worked before 20/04
        const startOfDay = new Date(`${dateStr}T00:00:00`);
        const endOfDay = new Date(`${dateStr}T23:59:59`);
        
        this.logger.debug(`Query window (Local): ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);

        // 3. Fetch all required data for the day
        const [allEvents, allDaily, allLeaves, holiday] = await Promise.all([
            this.eventsRepo.find({
                where: { timestamp: Between(startOfDay, endOfDay) },
                relations: ['employee'],
                order: { timestamp: 'ASC' }
            }),
            this.dailyRepo.find({
                where: { date: dateStr },
                relations: ['employee']
            }),
            this.leaveRequestsService.getApprovedLeavesForDay(dateStr),
            this.holidaysService.findByDate(dateStr)
        ]);

        this.logger.log(`Fetched Data: Events=${allEvents.length}, Samples=${allDaily.length}, Leaves=${allLeaves.length}, Holiday=${!!holiday}`);

        // 4. Group data by employeeId for fast lookup
        const eventsMap = new Map<string, AttendanceEvent[]>();
        allEvents.forEach(ev => {
            // Try different ways to get employee ID to be extra safe with batch loading
            const empId = ev.employee?.id || (ev as any).employeeId;
            if (empId) {
                const list = eventsMap.get(empId) || [];
                list.push(ev);
                eventsMap.set(empId, list);
            }
        });

        const dailyMap = new Map<string, DailyAttendance>();
        allDaily.forEach(d => {
            if (d.employee) dailyMap.set(d.employee.id, d);
        });

        const leavesMap = new Map<string, any>();
        allLeaves.forEach(l => {
            if (l.employee) leavesMap.set(l.employee.id, l);
        });

        const recordsToSave: DailyAttendance[] = [];

        // 5. Process each employee
        for (const emp of employees) {
            let daily = dailyMap.get(emp.id);
            if (!daily) {
                daily = new DailyAttendance();
                daily.employee = emp;
                daily.date = dateStr;
                daily.meta = {};
            }

            const events = eventsMap.get(emp.id) || [];
            const approvedLeave = leavesMap.get(emp.id);

            if (approvedLeave) {
                daily.status = 'LICENSE';
                daily.isAbsent = false;
                daily.meta = { 
                    ...daily.meta, 
                    leaveTypeId: approvedLeave.type?.id, 
                    leaveTypeName: approvedLeave.type?.name 
                };

                if (events.length > 0) {
                    daily.inTime = events[0].timestamp;
                    daily.outTime = events.length > 1 ? events[events.length - 1].timestamp : null;
                    if (daily.outTime && daily.inTime) {
                        const diffMs = daily.outTime.getTime() - daily.inTime.getTime();
                        daily.hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
                    }
                } else {
                    daily.inTime = null;
                    daily.outTime = null;
                    daily.hoursWorked = 0;
                }
            } else if (events.length === 0) {
                if (holiday) {
                    daily.status = 'HOLIDAY';
                    daily.isAbsent = false;
                    daily.meta = { ...daily.meta, holidayName: holiday.description };
                } else {
                    const dateObj = new Date(dateStr + 'T12:00:00');
                    const dayOfWeek = dateObj.getDay();
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
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
                daily.status = 'PRESENT';
                daily.isAbsent = false;
                daily.inTime = events[0].timestamp;

                // Deduplicate exit punch
                let latestValidExit: Date | null = null;
                for (let i = events.length - 1; i > 0; i--) {
                    const timeDiffMs = events[i].timestamp.getTime() - events[0].timestamp.getTime();
                    if (timeDiffMs > 10 * 60 * 1000) {
                        latestValidExit = events[i].timestamp;
                        break;
                    }
                }
                daily.outTime = latestValidExit;

                if (daily.outTime && daily.inTime) {
                    const diffMs = daily.outTime.getTime() - daily.inTime.getTime();
                    daily.hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
                } else {
                    daily.hoursWorked = 0;
                }
            }
            recordsToSave.push(daily);
        }

        // 6. Batch save
        if (recordsToSave.length > 0) {
            await this.dailyRepo.save(recordsToSave);
        }

        this.logger.log(`Finished processing ${dateStr}. Total records: ${recordsToSave.length}`);
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
     * Scheduled 10-minute cron to keep TODAY's attendance fresh
     * Runs every 10 minutes (except late night) to ensure dashboard accuracy
     */
    @Cron('0 */10 6-23 * * *')
    async handleFrequentTodayUpdate() {
        if (process.env.NODE_ENV === 'development' && process.env.SKIP_CRON === 'true') return;

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        this.logger.log(`Scheduled 10-minute update: processing ${todayStr}...`);
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
