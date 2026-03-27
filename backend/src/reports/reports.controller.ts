import { Controller, Get, Post, Body, UseGuards, Query, BadRequestException, Logger } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { EmailConfig } from './email-config.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { AttendanceProcessorService } from '../attendance/attendance-processor.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
    private readonly logger = new Logger(ReportsController.name);

    constructor(
        private readonly reportsService: ReportsService,
        private readonly attendanceProcessor: AttendanceProcessorService,
    ) { }

    @Get('config')
    @Roles(Role.ADMIN)
    getConfig() {
        return this.reportsService.getConfig();
    }

    @Post('config')
    @Roles(Role.ADMIN)
    updateConfig(@Body() config: Partial<EmailConfig>) {
        return this.reportsService.updateConfig(config);
    }

    @Get('dashboard-stats')
    @Roles(Role.ADMIN)
    async getDashboardStats() {
        return this.reportsService.getDashboardStats();
    }

    @Post('send-now')
    @Roles(Role.ADMIN)
    async sendNow() {
        return this.reportsService.sendDailyReportNow();
    }

    @Get('daily')
    @Roles(Role.ADMIN)
    async getDailyReport(@Query('date') date: string) {
        if (!date) throw new BadRequestException('Date is required');
        return this.reportsService.getDailyReportData(date);
    }

    @Get('monthly')
    @Roles(Role.ADMIN)
    async getMonthlyReport(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('month') month: number,
        @Query('year') year: number,
    ) {
        // Support date-range or legacy month/year
        let start: string;
        let end: string;

        if (startDate && endDate) {
            start = startDate;
            end = endDate;
        } else if (month && year) {
            // Backward compatibility: convert month/year to date range
            const m = Number(month);
            const y = Number(year);
            const startObj = new Date(y, m - 1, 1);
            const endObj = new Date(y, m, 0);
            start = startObj.toISOString().split('T')[0];
            end = endObj.toISOString().split('T')[0];
        } else {
            throw new BadRequestException('Se requiere startDate+endDate o month+year');
        }

        return this.reportsService.getMonthlyReport(start, end);
    }

    /**
     * POST /reports/reprocess-range — Reprocess daily attendance for a date range
     */
    @Post('reprocess-range')
    @Roles(Role.ADMIN)
    async reprocessRange(@Body() body: { startDate: string; endDate: string }) {
        if (!body.startDate || !body.endDate) {
            throw new BadRequestException('Se requiere startDate y endDate');
        }

        const start = new Date(body.startDate);
        const end = new Date(body.endDate);
        const processed: string[] = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            this.logger.log(`Reprocessing ${dateStr}...`);
            await this.attendanceProcessor.processDay(dateStr);
            processed.push(dateStr);
        }

        return { success: true, daysProcessed: processed.length, dates: processed };
    }
}
