import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EmployeesService } from '../employees/employees.service';
import { AttendanceService } from '../attendance/attendance.service';
import { EventType } from '../attendance/attendance-event.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const employeesService = app.get(EmployeesService);
    const attendanceService = app.get(AttendanceService);

    const DATA_DIR = 'd:/sistemarrhh/data';
    const EVENTS_DIR = 'd:/sistemarrhh/data'; // Events are here too based on analysis

    console.log('Starting migration...');

    // 1. Migrate Employees
    const employeesFile = path.join(DATA_DIR, 'employees.json');
    if (fs.existsSync(employeesFile)) {
        const data = JSON.parse(fs.readFileSync(employeesFile, 'utf8'));
        const employees = data.employees || [];
        console.log(`Found ${employees.length} employees to migrate.`);

        for (const emp of employees) {
            if (!emp.employeeKey) continue;

            // Split name if possible
            const parts = (emp.name || '').split(' ');
            const firstName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || 'Unknown';
            const lastName = parts.length > 0 ? parts[0] : 'Unknown';

            try {
                const existing = await employeesService.findByEmployeeKey(String(emp.employeeKey));
                if (existing) {
                    // console.log(`Employee ${emp.employeeKey} already exists. Skipping.`);
                    continue;
                }

                await employeesService.create({
                    employeeKey: String(emp.employeeKey),
                    firstName: firstName,
                    lastName: lastName,
                    isActive: emp.active !== false,
                    // We don't have all fields in legacy json, so we fill what we have
                });
                // console.log(`Migrated employee: ${emp.name}`);
            } catch (e) {
                console.error(`Error migrating employee ${emp.employeeKey}:`, e.message);
            }
        }
    } else {
        console.log('No employees.json found.');
    }

    // 2. Migrate Events
    const files = fs.readdirSync(EVENTS_DIR).filter(f => f.startsWith('events_') && f.endsWith('.jsonl'));
    console.log(`Found ${files.length} event files.`);

    // We need a map of employeeKey -> UUID to link events
    const allEmployees = await employeesService.findAll();
    const empMap = new Map();
    allEmployees.forEach(e => empMap.set(e.employeeKey, e));

    for (const file of files) {
        console.log(`Processing ${file}...`);
        const filePath = path.join(EVENTS_DIR, file);
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        for await (const line of rl) {
            try {
                if (!line.trim()) continue;
                const ev = JSON.parse(line);
                // Map legacy event to new entity
                // Legacy: { employeeKey, dateTime, deviceIp, ... }

                const emp = empMap.get(String(ev.employeeKey));
                if (!emp) {
                    // console.warn(`Skipping event for unknown employee: ${ev.employeeKey}`);
                    continue;
                }

                await attendanceService.create({
                    employee: emp,
                    timestamp: new Date(ev.dateTime),
                    deviceId: ev.deviceIp || 'legacy',
                    type: EventType.UNKNOWN, // Legacy system doesn't strictly distinguish IN/OUT in raw events usually
                    rawData: ev,
                    isProcessed: true, // Legacy events are considered processed
                });

            } catch (e) {
                console.error(`Error parsing line in ${file}:`, e.message);
            }
        }
    }

    console.log('Migration complete.');
    await app.close();
}

bootstrap();
