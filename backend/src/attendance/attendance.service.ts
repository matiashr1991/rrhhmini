import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceEvent, EventType } from './attendance-event.entity';
import { EmployeesService } from '../employees/employees.service';

@Injectable()
export class AttendanceService {
    private readonly logger = new Logger(AttendanceService.name);

    constructor(
        @InjectRepository(AttendanceEvent)
        private eventsRepository: Repository<AttendanceEvent>,
        private employeesService: EmployeesService,
    ) { }

    async findAll(): Promise<AttendanceEvent[]> {
        return this.eventsRepository.find({
            order: { timestamp: 'DESC' },
            relations: ['employee'],
            take: 100 // Limit to last 100 for now
        });
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
        event.type = EventType.UNKNOWN; // We can infer IN/OUT later based on time logic

        if (employee) {
            event.employee = employee;
        } else {
            this.logger.warn(`Event for unknown employee key: ${employeeKey}`);
            // We still save it, but without relation? Or maybe we strictly need relation?
            // For now let's save it to capture the log.
            // Note: AttendanceEvent.employee is ManyToOne, likely nullable by default unless specified.
            // Let's check entity definition. If it's nullable, we are good.
        }

        await this.eventsRepository.save(event);
        return { saved: true, id: event.id };
    }

    async create(data: Partial<AttendanceEvent>): Promise<AttendanceEvent> {
        const event = this.eventsRepository.create(data);
        return this.eventsRepository.save(event);
    }
}
