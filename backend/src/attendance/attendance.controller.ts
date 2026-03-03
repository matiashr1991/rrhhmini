import { Controller, Get, Post, Body, UseInterceptors, UploadedFile, Req, BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceProcessorService } from './attendance-processor.service';
import { FileInterceptor } from '@nestjs/platform-express'; // We might need this if we handle multipart/form-data with file upload, but Hikvision sends a field `event_log` which is a string.

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
        // Trigger processing on demand for now (in production this should be async or cron)
        await this.processor.processDay(date);
        return this.processor.getDailyReport(date);
    }

    // Endpoint that matches legacy /hikvision/events but we'll use /attendance/hikvision
    // Legacy used multipart/form-data with a field 'event_log' containing JSON.
    // NestJS FileInterceptor handles multipart.
    @Post('hikvision')
    @UseInterceptors(FileInterceptor('file')) // Dummy interceptor to handle multipart ?
    // Actually, to read a field from multipart without a file, we can use @Body().
    // However, NestJS requires Multer for multipart.
    async handleHikvision(@Req() req, @Body() body) {
        // If the device sends application/json, body will be the object.
        // If it sends multipart/form-data, we need to extract 'event_log'.

        let payload = body;

        // If 'event_log' field exists (legacy style)
        if (body.event_log) {
            try {
                payload = JSON.parse(body.event_log);
            } catch (e) {
                throw new BadRequestException('Invalid JSON in event_log');
            }
        }

        return this.attendanceService.processHikvisionEvent(payload);
    }
}
