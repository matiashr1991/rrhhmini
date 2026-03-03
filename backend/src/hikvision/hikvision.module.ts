import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HikvisionSyncState } from './hikvision-sync-state.entity';
import { HikvisionPollerService } from './hikvision-poller.service';
import { HikvisionController } from './hikvision.controller';
import { AttendanceEvent } from '../attendance/attendance-event.entity';
import { EmployeesModule } from '../employees/employees.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([HikvisionSyncState, AttendanceEvent]),
        EmployeesModule,
    ],
    providers: [HikvisionPollerService],
    controllers: [HikvisionController],
    exports: [HikvisionPollerService],
})
export class HikvisionModule { }
