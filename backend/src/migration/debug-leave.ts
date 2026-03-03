
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EmployeesService } from '../employees/employees.service';
import { LeaveRequestsService } from '../leave-requests/leave-requests.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const employeesService = app.get(EmployeesService);
    const leaveService = app.get(LeaveRequestsService);

    const legajo = '17039472'; // Alsina
    const dateToCheck = '2026-01-05';

    console.log(`Checking leave for Legajo ${legajo} on ${dateToCheck}...`);

    const emp = await employeesService.findByEmployeeKey(legajo);
    if (!emp) {
        console.error('Employee not found');
        return;
    }
    console.log(`Employee ID: ${emp.id}`);

    // 1. Check all requests for this employee
    const requests = await leaveService.findMyRequests(emp.id);
    console.log(`Found ${requests.length} total requests for employee.`);
    requests.forEach(r => {
        console.log(`- [${r.status}] ${r.startDate} to ${r.endDate} (${r.type?.name})`);
    });

    // 2. Check specific method
    const approved = await leaveService.getApprovedLeave(emp.id, dateToCheck);
    console.log(`getApprovedLeave result:`, approved ? `MATCH: ${approved.type?.name}` : 'NULL');

    await app.close();
}

bootstrap();
