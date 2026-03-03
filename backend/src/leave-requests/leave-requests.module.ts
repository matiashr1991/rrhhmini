import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveRequestsController } from './leave-requests.controller';
import { LeaveRequest } from './leave-request.entity';
import { LeaveType } from './leave-type.entity';
import { LeaveTypesService } from './leave-types.service';
import { LeaveTypesController } from './leave-types.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmployeesModule } from '../employees/employees.module';
import { EmployeeLeaveQuota } from './leave-quota.entity';
import { LeaveQuotasService } from './leave-quotas.service';
import { LeaveQuotasController } from './leave-quotas.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([LeaveRequest, LeaveType, EmployeeLeaveQuota]),
        NotificationsModule,
        EmployeesModule
    ],
    controllers: [LeaveRequestsController, LeaveTypesController, LeaveQuotasController],
    providers: [LeaveRequestsService, LeaveTypesService, LeaveQuotasService],
    exports: [LeaveRequestsService, LeaveTypesService, LeaveQuotasService],
})
export class LeaveRequestsModule { }
