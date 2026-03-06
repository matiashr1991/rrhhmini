import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AttendanceEvent, EventType } from './attendance-event.entity';
import { DailyAttendance } from './daily-attendance.entity';
import { EmployeesService } from '../employees/employees.service';

@Injectable()
export class AttendanceService {
    private readonly logger = new Logger(AttendanceService.name);

    constructor(
        @InjectRepository(AttendanceEvent)
        private eventsRepository: Repository<AttendanceEvent>,
        @InjectRepository(DailyAttendance)
        private dailyRepo: Repository<DailyAttendance>,
        private employeesService: EmployeesService,
    ) { }

    async findAll(date?: string): Promise<AttendanceEvent[]> {
        const query: any = {
            order: { timestamp: 'DESC' },
            relations: ['employee'],
        };

        if (date) {
            const startOfDay = new Date(`${date}T00:00:00.000`);
            const endOfDay = new Date(`${date}T23:59:59.999`);
            // Adjust bounds to prevent Timezone shift dropping end of day events if server is in different TZ
            // Here we assume the Date constructor parses Local Time accurately for the server.
            query.where = { timestamp: Between(startOfDay, endOfDay) };
            // Optional: increase or remove take limit since we're scoped by date
            query.take = 5000;
        } else {
            query.take = 200; // Limit to last 200 if no date provided
        }

        return this.eventsRepository.find(query);
    }

    async processHikvisionEvent(payload: any) {
        // Based on legacy server.js extractEvent function
        const ace = payload.AccessControllerEvent || payload;

        // Extract fields
        const employeeKey = String(ace.employeeNoString || ace.employeeNo || ace.cardNo || "").trim();
        const dateTime = payload.dateTime || payload.eventTime || payload.time;
        const serialNo = ace.serialNo;
        const deviceIp = payload.ipAddress;

        if (!employeeKey || !dateTime) {
            this.logger.warn('Invalid event received: Missing key or time', payload);
            return { saved: false, reason: 'missing_data' };
        }

        // Parse Date
        const timestamp = new Date(dateTime);
        if (isNaN(timestamp.getTime())) {
            return { saved: false, reason: 'invalid_date' };
        }

        // Deduplication check (simple)
        if (serialNo) {
            const exists = await this.eventsRepository.findOne({ where: { serialNo } });
            if (exists) return { saved: false, reason: 'duplicate_serial' };
        }

        // Find Employee
        const employee = await this.employeesService.findByEmployeeKey(employeeKey);

        const event = new AttendanceEvent();
        event.timestamp = timestamp;
        event.deviceId = deviceIp;
        event.serialNo = serialNo;
        event.rawData = payload;
        event.type = EventType.UNKNOWN;

        if (employee) {
            event.employee = employee;
        } else {
            this.logger.warn(`Event for unknown employee key: ${employeeKey}`);
        }

        await this.eventsRepository.save(event);
        return { saved: true, id: event.id };
    }

    async create(data: Partial<AttendanceEvent>): Promise<AttendanceEvent> {
        const event = this.eventsRepository.create(data);
        return this.eventsRepository.save(event);
    }

    /**
     * Create a manual attendance event from the UI.
     */
    async createManualEvent(employeeId: string, timestamp: string): Promise<AttendanceEvent> {
        const employee = await this.employeesService.findOne(employeeId);
        if (!employee) {
            throw new NotFoundException(`Empleado ${employeeId} no encontrado`);
        }

        const ts = new Date(timestamp);
        if (isNaN(ts.getTime())) {
            throw new BadRequestException('Fecha/hora inválida');
        }

        const event = this.eventsRepository.create({
            employee,
            timestamp: ts,
            deviceId: 'manual',
            type: EventType.UNKNOWN,
            rawData: { manual: true, createdAt: new Date().toISOString() },
            isProcessed: false,
        });

        return this.eventsRepository.save(event);
    }

    /**
     * Override the status of a daily attendance record.
     */
    async updateDailyStatus(dailyId: string, status: string): Promise<DailyAttendance> {
        const daily = await this.dailyRepo.findOne({ where: { id: dailyId }, relations: ['employee'] });
        if (!daily) {
            throw new NotFoundException(`Registro diario ${dailyId} no encontrado`);
        }

        const validStatuses = ['PRESENT', 'ABSENT', 'LICENSE', 'HOLIDAY', 'OFF'];
        if (!validStatuses.includes(status)) {
            throw new BadRequestException(`Estado inválido: ${status}`);
        }

        daily.status = status;
        daily.isAbsent = status === 'ABSENT';
        return this.dailyRepo.save(daily);
    }
}
