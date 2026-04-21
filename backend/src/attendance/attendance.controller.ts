import { Controller, Get, Post, Patch, Param, Body, UseGuards, UseInterceptors, Req, BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceProcessorService } from './attendance-processor.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';

@Controller('attendance')
export class AttendanceController {
    constructor(
        private readonly attendanceService: AttendanceService,
        private readonly processor: AttendanceProcessorService,
        private readonly auditService: AuditService,
    ) { }

    @Get('logs')
    findAll(@Req() req) {
        return this.attendanceService.findAll(req.query.date as string);
    }

    @Get('my-attendance')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.EMPLOYEE, Role.ADMIN)
    async findMyAttendance(@Req() req) {
        if (!req.user.employeeId) {
            throw new BadRequestException('Tu usuario no está vinculado a un empleado.');
        }
        return this.attendanceService.findByEmployee(req.user.employeeId);
    }

    @Get('daily')
    async getDaily(@Req() req) {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        await this.processor.processDay(date);
        return this.processor.getDailyReport(date);
    }

    @Post('hikvision')
    @UseInterceptors(FileInterceptor('file'))
    async handleHikvision(@Req() req, @Body() body) {
        let payload = body;

        if (body.event_log) {
            try {
                payload = JSON.parse(body.event_log);
            } catch (e) {
                throw new BadRequestException('Invalid JSON in event_log');
            }
        }

        return this.attendanceService.processHikvisionEvent(payload);
    }

    /**
     * POST /attendance/manual — Solo ADMIN
     */
    @Post('manual')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async createManualEvent(@Req() req, @Body() body: { employeeId: string; timestamp: string }) {
        if (!body.employeeId || !body.timestamp) {
            throw new BadRequestException('Se requiere employeeId y timestamp');
        }
        const event = await this.attendanceService.createManualEvent(body.employeeId, body.timestamp);

        // Audit trail
        this.auditService.log({
            userId: req.user?.userId,
            username: req.user?.username || 'unknown',
            action: AuditAction.CREATE,
            entity: 'AttendanceEvent',
            entityId: event.id,
            details: {
                type: 'MANUAL_ENTRY',
                employeeId: body.employeeId,
                timestamp: body.timestamp,
            },
            ipAddress: req.ip || req.headers?.['x-forwarded-for'] || 'unknown',
            userAgent: req.headers?.['user-agent'] || 'unknown',
        });

        return { saved: true, id: event.id };
    }

    /**
     * PATCH /attendance/daily/:id — Solo ADMIN
     */
    @Patch('daily/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async updateDailyStatus(@Req() req, @Param('id') id: string, @Body() body: { status: string }) {
        if (!body.status) {
            throw new BadRequestException('Se requiere status');
        }
        const result = await this.attendanceService.updateDailyStatus(id, body.status);

        // Audit trail
        this.auditService.log({
            userId: req.user?.userId,
            username: req.user?.username || 'unknown',
            action: AuditAction.UPDATE,
            entity: 'DailyAttendance',
            entityId: id,
            details: {
                type: 'MANUAL_STATUS_OVERRIDE',
                newStatus: body.status,
            },
            ipAddress: req.ip || req.headers?.['x-forwarded-for'] || 'unknown',
            userAgent: req.headers?.['user-agent'] || 'unknown',
        });

        return result;
    }
}

