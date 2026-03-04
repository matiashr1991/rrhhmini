import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditService, AuditLogFilters } from './audit.service';
import { AuditAction } from './audit-log.entity';

@Controller('audit-logs')
@UseGuards(AuthGuard('jwt'))
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('userId') userId?: string,
        @Query('action') action?: AuditAction,
        @Query('entity') entity?: string,
        @Query('search') search?: string,
    ) {
        const filters: AuditLogFilters = {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? Math.min(parseInt(limit, 10), 200) : 50,
            startDate,
            endDate,
            userId,
            action,
            entity,
            search,
        };

        return this.auditService.findAll(filters);
    }
}
