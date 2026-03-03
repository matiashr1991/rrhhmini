
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EmployeesService } from '../employees/employees.service';
import { AttendanceService } from '../attendance/attendance.service';
import { AttendanceProcessorService } from '../attendance/attendance-processor.service';
import { EventType } from '../attendance/attendance-event.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const employeesService = app.get(EmployeesService);
    const attendanceService = app.get(AttendanceService);
    const attendanceProcessor = app.get(AttendanceProcessorService);

    const DATA_DIR = 'd:/sistemarrhh/data';
    console.log('Starting Full Legacy Import & Processing...');

    // 1. Load Employees Map
    const allEmployees = await employeesService.findAll();
    const empMap = new Map();
    allEmployees.forEach(e => {
        empMap.set(String(e.employeeKey), e);
    });
    console.log(`Loaded ${empMap.size} employees.`);

    // 2. Identify Files
    const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('events_202') && f.endsWith('.jsonl'));
    console.log(`Found ${files.length} event files.`);

    // 3. Import Events & Track Date Range
    let totalImported = 0;
    const processedDates = new Set<string>();

    for (const file of files) {
        // Extract date from filename: events_YYYY_MM_DD.jsonl
        const match = file.match(/events_(\d{4}_\d{2}_\d{2})\.jsonl/);
        if (match) {
            const dateStr = match[1].replace(/_/g, '-');
            processedDates.add(dateStr);
        }

        console.log(`Importing ${file}...`);
        const filePath = path.join(DATA_DIR, file);
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        for await (const line of rl) {
            try {
                if (!line.trim()) continue;
                const ev = JSON.parse(line);
                const emp = empMap.get(String(ev.employeeKey));

                if (!emp) continue;

                await attendanceService.create({
                    employee: emp,
                    timestamp: new Date(ev.dateTime),
                    deviceId: ev.deviceIp || 'legacy-import',
                    type: EventType.UNKNOWN,
                    rawData: ev,
                    isProcessed: true
                });
                totalImported++;
            } catch (e) {
                // Ignore errors
            }
        }
    }

    console.log(`Imported ${totalImported} events.`);

    // 4. Process Days
    // We want to process a continuous range from min date to max date found + any specific dates
    // Actually, finding the min and max date is safer to cover weekends/holidays where no events might exist.

    const dates = Array.from(processedDates).sort();
    if (dates.length > 0) {
        const minDate = new Date(dates[0]);
        const maxDate = new Date(dates[dates.length - 1]);

        console.log(`Processing report range: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);

        for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            try {
                process.stdout.write(`Processing ${dateStr}... `);
                await attendanceProcessor.processDay(dateStr);
                console.log('OK');
            } catch (e) {
                console.log(`Error: ${e.message}`);
            }
        }
    }

    console.log('Full Import Complete.');
    await app.close();
}

bootstrap();
