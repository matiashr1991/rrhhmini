import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { Role } from '../auth/role.enum';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../auth/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepository = dataSource.getRepository(User);

    const username = 'admin';
    const password = 'admin123'; // Temporary password

    const existing = await userRepository.findOne({ where: { username } });
    if (existing) {
        console.log('Admin user already exists.');
    } else {
        console.log('Creating admin user...');
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(password, salt);

        const admin = userRepository.create({
            username,
            passwordHash: hash,
            role: Role.ADMIN,
        });

        await userRepository.save(admin);
        console.log(`Admin user created. Username: ${username}, Password: ${password}`);
    }

    await app.close();
}

bootstrap();
