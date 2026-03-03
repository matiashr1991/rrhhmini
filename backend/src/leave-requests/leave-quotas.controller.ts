import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { LeaveQuotasService } from './leave-quotas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller('leave-quotas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveQuotasController {
    constructor(private readonly quotasService: LeaveQuotasService) { }

    @Get()
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE)
    getQuotas(
        @Query('employeeId') employeeId?: string,
        @Query('year') year?: string
    ) {
        return this.quotasService.getQuotas(employeeId, year ? parseInt(year) : undefined);
    }

    @Get('balance')
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE, Role.EMPLOYEE)
    getBalance(
        @Query('employeeId') employeeId: string,
        @Query('leaveTypeId') leaveTypeId: string,
        @Query('year') year: string
    ) {
        return this.quotasService.getRemainingDays(employeeId, parseInt(leaveTypeId), parseInt(year));
    }

    @Post()
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE)
    upsertQuota(
        @Body() body: { employeeId: string; leaveTypeId: number; year: number; maxDays: number }
    ) {
        return this.quotasService.upsertQuota(body);
    }
}
