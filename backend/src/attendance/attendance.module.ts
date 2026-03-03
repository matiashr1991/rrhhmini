import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceEvent } from './attendance-event.entity';
import { DailyAttendance } from './daily-attendance.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceProcessorService } from './attendance-processor.service';
import { AttendanceController } from './attendance.controller';
import { EmployeesModule } from '../employees/employees.module';
import { LeaveRequestsModule } from '../leave-requests/leave-requests.module';
import { Holiday } from './holiday.entity';
import { HolidaysService } from './holidays.service';
import { HolidaysController } from './holidays.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([AttendanceEvent, DailyAttendance, Holiday]),
        EmployeesModule,
        LeaveRequestsModule
    ],
    providers: [AttendanceService, AttendanceProcessorService, HolidaysService],
    controllers: [AttendanceController, HolidaysController],
    exports: [AttendanceService, AttendanceProcessorService, HolidaysService]
})
export class AttendanceModule { }
