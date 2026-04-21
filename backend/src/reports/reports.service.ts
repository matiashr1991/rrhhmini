import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailConfig } from './email-config.entity';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AttendanceProcessorService } from '../attendance/attendance-processor.service';
import { EmployeesService } from '../employees/employees.service';
import { LeaveRequestsService } from '../leave-requests/leave-requests.service';
import { HolidaysService } from '../attendance/holidays.service';

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);
    private transporter: nodemailer.Transporter;

    constructor(
        @InjectRepository(EmailConfig)
        private configRepo: Repository<EmailConfig>,
        private attendanceProcessor: AttendanceProcessorService,
        private configService: ConfigService,
        private employeesService: EmployeesService,
        private leaveRequestsService: LeaveRequestsService,
        private holidaysService: HolidaysService,
    ) {
        this.initTransporter();
    }

    private initTransporter() {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('MAIL_HOST'),
            port: Number(this.configService.get('MAIL_PORT')),
            secure: false, // true for 465, false for other ports
            auth: {
                user: this.configService.get('MAIL_USER'),
                pass: this.configService.get('MAIL_PASS'),
            },
        });
    }

    async getConfig(): Promise<EmailConfig> {
        let config = await this.configRepo.findOne({ where: { id: 1 } });
        if (!config) {
            config = this.configRepo.create({ id: 1, recipients: '', scheduleTime: '18:00', isEnabled: false, dailyReportEnabled: true, monthlyReportEnabled: false });
            await this.configRepo.save(config);
        }
        return config;
    }

    async updateConfig(data: Partial<EmailConfig>): Promise<EmailConfig> {
        let config = await this.getConfig();
        Object.assign(config, data);
        return this.configRepo.save(config);
    }

    async sendEmail(to: string, subject: string, html: string) {
        if (!to) return;
        try {
            const info = await this.transporter.sendMail({
                from: this.configService.get('MAIL_FROM'),
                to,
                subject,
                html,
            });
            this.logger.log(`Email sent: ${info.messageId}`);
            return info;
        } catch (error) {
            this.logger.error(`Error sending email: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getDailyReportData(dateStr: string) {
        return this.attendanceProcessor.getDailyReport(dateStr);
    }

    async getDashboardStats() {
        const employees = await this.employeesService.findAll();
        const totalEmployeesCount = employees.length;

        const allLeaves = await this.leaveRequestsService.findAll();
        const pendingCount = allLeaves.filter(req => req.status === 'PENDING').length;

        const today = new Date();
        const chartData: any[] = [];
        let daysOffset = 0;
        let validDaysFound = 0;
        const rawValidDays: { d: Date; dateStr: string }[] = [];

        // Look back up to 30 days to find 7 valid working days
        while (validDaysFound < 7 && daysOffset < 30) {
            const d = new Date(today);
            d.setDate(d.getDate() - daysOffset);
            daysOffset++;

            const dayOfWeek = d.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            // Check if it's a holiday
            const holiday = await this.holidaysService.findByDate(dateStr);
            if (holiday) continue; // Skip holidays

            rawValidDays.unshift({ d, dateStr }); // Keep chronological order
            validDaysFound++;
        }

        for (const { d, dateStr } of rawValidDays) {
            const daily = await this.attendanceProcessor.getDailyReport(dateStr);
            let pres = 0; let abs = 0; let lic = 0;

            daily.forEach(record => {
                const st = record.status || (record.isAbsent ? 'ABSENT' : 'PRESENT');
                if (st === 'PRESENT') pres++;
                else if (st === 'ABSENT') abs++;
                else if (st === 'LICENSE') lic++;
            });

            const displayDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

            chartData.push({
                date: displayDate,
                rawDate: dateStr,
                presentes: pres,
                ausentes: abs,
                licencias: lic
            });
        }

        // Use the already calculated todayStr for KPIs
        // Specifically calculate TODAY for the top KPIs
        const yearToday = today.getFullYear();
        const monthToday = String(today.getMonth() + 1).padStart(2, '0');
        const dayToday = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yearToday}-${monthToday}-${dayToday}`;

        const dailyToday = await this.attendanceProcessor.getDailyReport(todayStr);
        let presToday = 0; let absToday = 0; let licToday = 0;
        dailyToday.forEach(record => {
            const st = record.status || (record.isAbsent ? 'ABSENT' : 'PRESENT');
            if (st === 'PRESENT') presToday++;
            else if (st === 'ABSENT') absToday++;
            else if (st === 'LICENSE') licToday++;
        });

        return {
            kpis: {
                totalEmployees: totalEmployeesCount,
                presentToday: presToday,
                absentToday: absToday,
                licenseToday: licToday,
                pendingRequests: pendingCount
            },
            chartData
        };
    }

    async generateDailyReportHtml(dateStr: string): Promise<string> {
        const report = await this.attendanceProcessor.getDailyReport(dateStr);

        let html = `
        <h1>Reporte Diario de Asistencia - ${dateStr}</h1>
        <table border="1" style="border-collapse: collapse; width: 100%;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th>Legajo</th>
                    <th>Nombre</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Horas</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
        `;

        if (report.length === 0) {
            html += `<tr><td colspan="6" style="text-align:center;">No hay registros procesados.</td></tr>`;
        } else {
            report.forEach(row => {
                const inTime = row.inTime ? new Date(row.inTime).toLocaleTimeString() : '-';
                const outTime = row.outTime ? new Date(row.outTime).toLocaleTimeString() : '-';

                // Use new status field if available, fallback to logic
                let status = row.status;
                if (!status) {
                    status = row.isAbsent ? 'Ausente' : (row.isLate ? 'Tarde' : 'Presente');
                }

                // Translate status
                const statusMap = {
                    'PRESENT': 'Presente',
                    'ABSENT': 'Ausente',
                    'LICENSE': 'Licencia',
                    'HOLIDAY': 'Feriado',
                    'OFF': 'Franco'
                };
                const displayStatus = statusMap[status] || status;

                let color = '#ffffff';
                if (status === 'ABSENT') color = '#fee2e2'; // Red
                else if (status === 'LICENSE') color = '#e0f2fe'; // Blue
                else if (status === 'HOLIDAY') color = '#f3e8ff'; // Purple
                else if (row.isLate) color = '#fef3c7'; // Yellow

                html += `
                <tr style="background-color: ${color};">
                    <td>${row.employee.employeeKey}</td>
                    <td>${row.employee.lastName}, ${row.employee.firstName}</td>
                    <td>${inTime}</td>
                    <td>${outTime}</td>
                    <td>${row.hoursWorked}</td>
                    <td>${displayStatus}</td>
                </tr>
                `;
            });
        }

        html += `</tbody></table>`;
        return html;
    }

    async getMonthlyReport(startDate: string, endDate: string) {
        const rawData = await this.attendanceProcessor.getMonthlyAttendance(startDate, endDate);
        const employees = {};

        // Group by employee
        rawData.forEach(record => {
            const empId = record.employee.id;
            if (!employees[empId]) {
                employees[empId] = {
                    employee: record.employee,
                    days: [],
                    stats: {
                        present: 0,
                        absent: 0,
                        license: 0,
                        totalHours: 0,
                        daysWorkedForAverage: 0
                    }
                };
            }
            employees[empId].days.push(record);

            // Calc stats
            const status = record.status || (record.isAbsent ? 'ABSENT' : 'PRESENT');
            if (status === 'PRESENT') {
                employees[empId].stats.present++;

                // Average logic: Cap at 6 hours
                const hours = record.hoursWorked || 0;
                const cappedHours = Math.min(hours, 6);
                employees[empId].stats.totalHours += cappedHours;
                employees[empId].stats.daysWorkedForAverage++;

            } else if (status === 'ABSENT') {
                employees[empId].stats.absent++;
            } else if (status === 'LICENSE') {
                employees[empId].stats.license++;
            }
        });

        const report = Object.values(employees).map((data: any) => {
            // Use only days where the employee was actually PRESENT for the average
            // This excludes weekends (OFF), holidays, licenses, and absences
            const daysWorked = data.stats.daysWorkedForAverage;
            const avg = daysWorked > 0
                ? (data.stats.totalHours / daysWorked).toFixed(2)
                : 0;

            return {
                employee: {
                    id: data.employee.id,
                    key: data.employee.employeeKey,
                    name: `${data.employee.lastName}, ${data.employee.firstName}`
                },
                stats: {
                    present: data.stats.present,
                    absent: data.stats.absent,
                    license: data.stats.license,
                    averageHours: avg
                },
                details: data.days.map(d => ({
                    date: d.date,
                    inTime: d.inTime,
                    outTime: d.outTime,
                    hoursWorked: d.hoursWorked,
                    status: d.status,
                    isLate: d.isLate,
                    isAbsent: d.isAbsent,
                    leaveTypeName: d.meta?.leaveTypeName
                }))
            };
        });

        return report.sort((a, b) => a.employee.name.localeCompare(b.employee.name));
    }

    async sendDailyReportNow() {
        const config = await this.getConfig();
        if (!config.recipients) throw new Error('No recipients configured');

        const today = new Date().toISOString().split('T')[0];

        // Ensure data is processed
        await this.attendanceProcessor.processDay(today);

        const html = await this.generateDailyReportHtml(today);
        await this.sendEmail(config.recipients, `Parte Diario - ${today}`, html);

        return { success: true, message: 'Report sent' };
    }

    async sendMonthlyReportNow(month: number, year: number) {
        const config = await this.getConfig();
        if (!config.recipients) throw new Error('No recipients configured');

        // Convert month/year to date range for the report
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const reportData = await this.getMonthlyReport(startStr, endStr);

        let html = `
        <h1>Reporte Mensual - ${month}/${year}</h1>
        <table border="1" style="border-collapse: collapse; width: 100%;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th>Legajo</th>
                    <th>Nombre</th>
                    <th>Días Presente</th>
                    <th>Faltas</th>
                    <th>Licencias</th>
                    <th>Promedio Horas</th>
                </tr>
            </thead>
            <tbody>
        `;

        if (reportData.length === 0) {
            html += `<tr><td colspan="6" style="text-align:center;">No hay registros para el período.</td></tr>`;
        } else {
            reportData.forEach(row => {
                html += `
                <tr>
                    <td>${row.employee.key}</td>
                    <td>${row.employee.name}</td>
                    <td>${row.stats.present}</td>
                    <td>${row.stats.absent}</td>
                    <td>${row.stats.license}</td>
                    <td>${row.stats.averageHours}</td>
                </tr>
                `;
            });
        }

        html += `</tbody></table>`;
        await this.sendEmail(config.recipients, `Parte Mensual - ${month}/${year}`, html);

        return { success: true, message: 'Monthly report sent' };
    }

    // Cron job to run every minute and check if it matches the configured time
    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        const config = await this.getConfig();
        if (!config.isEnabled) return;

        const now = new Date();
        const currentHour = String(now.getHours()).padStart(2, '0');
        const currentMinute = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHour}:${currentMinute}`;

        if (currentTime === config.scheduleTime) {
            this.logger.log(`Executing scheduled report for ${currentTime}`);

            if (config.dailyReportEnabled) {
                try {
                    await this.sendDailyReportNow();
                } catch (e) {
                    this.logger.error(`Failed to send daily report: ${e}`);
                }
            }

            // If monthly is enabled and today is the 1st of the month, send previous month's report
            if (config.monthlyReportEnabled && now.getDate() === 1) {
                try {
                    let reportMonth = now.getMonth(); // 0-indexed, so getMonth() is the previous month! (e.g. Jan=0, but if it's Feb 1st, getMonth() returns 1 which we treat as 1 for January since our API is 1-indexed)
                    let reportYear = now.getFullYear();
                    if (reportMonth === 0) {
                        reportMonth = 12;
                        reportYear--;
                    }
                    this.logger.log(`Executing scheduled MONTHLY report for ${reportMonth}/${reportYear}`);
                    await this.sendMonthlyReportNow(reportMonth, reportYear);
                } catch (e) {
                    this.logger.error(`Failed to send monthly report: ${e}`);
                }
            }
        }
    }
}
