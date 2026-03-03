import { Controller, Get, Post, Body, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { EmailConfig } from './email-config.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

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
        // We reuse the processor logic but maybe we want the raw data or the HTML?
        // The service generateDailyReportHtml returns HTML strings.
        // Let's create a method in service to return JSON data if needed, or just return the processor data directly.
        // The processor has getDailyReport(date) which returns DailyAttendance entities.
        return this.reportsService.getDailyReportData(date);
    }

    @Get('monthly')
    @Roles(Role.ADMIN)
    async getMonthlyReport(@Query('month') month: number, @Query('year') year: number) {
        if (!month || !year) throw new BadRequestException('Month and Year are required');
        return this.reportsService.getMonthlyReport(Number(month), Number(year));
    }
}
