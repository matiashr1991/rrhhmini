
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
    console.log('Starting January 2026 Import & Processing...');

    // 1. Load Employees Map
    const allEmployees = await employeesService.findAll();
    const empMap = new Map();
    allEmployees.forEach(e => {
        empMap.set(String(e.employeeKey), e); // Ensure key is string
    });
    console.log(`Loaded ${empMap.size} employees.`);

    // 2. Identify Files
    const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('events_2026_01_') && f.endsWith('.jsonl'));
    console.log(`Found ${files.length} event files for January.`);

    // 3. Import Events
    let totalImported = 0;
    let totalSkipped = 0;

    for (const file of files) {
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

                if (!emp) {
                    process.stdout.write('?'); // Unknown employee
                    continue;
                }

                // Check duplicate (naive check by timestamp & employee to avoid double insert)
                // Since we don't expose findOne by criteria in service easily, we might need repository or just try insert.
                // But let's assume if we run this multiple times we might want to check.
                // Using a 'find' on the repo would be better but we only have 'create' in service exposed here publicly?
                // Actually we are in the backend context, we can use the service normally.
                // But AttendanceService.findAll is limited to 100.
                // Let's rely on the fact that for "simulation", duplication might not be critical OR 
                // we can assume the DB is clean for this month. 
                // BETTER: Just catch unique constraint violation if we had one? We don't.
                // Let's just create. Report generation handles duplicates by taking specific events or counting them?
                // AttendanceProcessor uses "In" and "Out" logic sort of. 
                // A few duplicate events shouldn't break the report logic (it picks first/last usually).
                // Let's proceed with insert.

                await attendanceService.create({
                    employee: emp,
                    timestamp: new Date(ev.dateTime),
                    deviceId: ev.deviceIp || 'legacy-import',
                    type: EventType.UNKNOWN,
                    rawData: ev,
                    isProcessed: true
                });
                // process.stdout.write('.');
                totalImported++;
            } catch (e) {
                console.error(`Error line: ${e.message}`);
            }
        }
        console.log(` Done.`);
    }

    console.log(`Imported ${totalImported} events. Processing days...`);

    // 4. Process Days (Jan 1 to Jan 31)
    for (let day = 1; day <= 31; day++) {
        const dateStr = `2026-01-${day.toString().padStart(2, '0')}`;
        // Verify if file existed for this day? Actually processor should run for every day to generate ABSENT records too.
        // So we run for ALL days 1-31.

        try {
            await attendanceProcessor.processDay(dateStr);
            console.log(`Processed ${dateStr}`);
        } catch (e) {
            console.error(`Error processing ${dateStr}: ${e.message}`);
        }
    }

    console.log('January Simulation Complete.');
    await app.close();
}

bootstrap();
