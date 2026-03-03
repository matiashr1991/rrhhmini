import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { EmailConfig } from './email-config.entity';
import { AttendanceModule } from '../attendance/attendance.module'; // Import to use AttendanceProcessorService
import { ConfigModule } from '@nestjs/config';
import { EmployeesModule } from '../employees/employees.module';
import { LeaveRequestsModule } from '../leave-requests/leave-requests.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([EmailConfig]),
        AttendanceModule,
        ConfigModule,
        EmployeesModule,
        LeaveRequestsModule,
    ],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
})
export class ReportsModule { }
