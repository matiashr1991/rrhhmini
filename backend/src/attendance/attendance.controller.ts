import { Controller, Get, Post, Patch, Param, Body, UseInterceptors, UploadedFile, Req, BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceProcessorService } from './attendance-processor.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('attendance')
export class AttendanceController {
    constructor(
        private readonly attendanceService: AttendanceService,
        private readonly processor: AttendanceProcessorService
    ) { }

    @Get('logs')
    findAll() {
        return this.attendanceService.findAll();
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
     * POST /attendance/manual
     * Create a manual attendance event. Body: { employeeId, timestamp }
     */
    @Post('manual')
    async createManualEvent(@Body() body: { employeeId: string; timestamp: string }) {
        if (!body.employeeId || !body.timestamp) {
            throw new BadRequestException('Se requiere employeeId y timestamp');
        }
        const event = await this.attendanceService.createManualEvent(body.employeeId, body.timestamp);
        return { saved: true, id: event.id };
    }

    /**
     * PATCH /attendance/daily/:id
     * Override the status of a daily attendance record. Body: { status }
     */
    @Patch('daily/:id')
    async updateDailyStatus(@Param('id') id: string, @Body() body: { status: string }) {
        if (!body.status) {
            throw new BadRequestException('Se requiere status');
        }
        return this.attendanceService.updateDailyStatus(id, body.status);
    }
}

