import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User } from '../auth/user.entity';
import { Employee } from '../employees/employee.entity';
import { Role } from '../auth/role.enum';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(User);
    const employeeRepo = dataSource.getRepository(Employee);

    console.log('Generating users for employees...');

    const employees = await employeeRepo.find();

    for (const emp of employees) {
        if (!emp.dni) {
            console.warn(`Skipping employee ${emp.lastName} (No DNI)`);
            continue;
        }

        // Check if user exists
        const existingUser = await userRepo.findOne({ where: { username: emp.dni } });
        if (existingUser) {
            console.log(`User for ${emp.dni} already exists.`);

            // Link if not linked
            if (!existingUser.employee) {
                existingUser.employee = emp;
                await userRepo.save(existingUser);
                console.log(`Linked existing user ${emp.dni} to employee.`);
            }
            continue;
        }

        // Create user
        // Username = DNI, Password = DNI
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(emp.dni, salt);

        const newUser = userRepo.create({
            username: emp.dni,
            passwordHash: hash,
            role: Role.EMPLOYEE,
            employee: emp,
        });

        await userRepo.save(newUser);
        console.log(`Created user for ${emp.lastName}, ${emp.firstName} (User: ${emp.dni})`);
    }

    console.log('User generation complete.');
    await app.close();
}

bootstrap();
