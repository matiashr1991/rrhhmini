import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User } from '../auth/user.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(User);

    const username = 'admin';
    const newPassword = 'admin123';

    console.log(`Resetting password for user: ${username}...`);

    const user = await userRepo.findOne({ where: { username } });

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(newPassword, salt);

    if (user) {
        user.passwordHash = hash;
        await userRepo.save(user);
        console.log(`Password for ${username} updated successfully.`);
    } else {
        console.log(`User ${username} not found. Creating...`);
        // If not found, create (though it should exist from seed)
        /* 
        const newUser = userRepo.create({
            username,
            passwordHash: hash,
            role: Role.ADMIN // Need to import Role
        });
        await userRepo.save(newUser);
        */
    }

    await app.close();
}

bootstrap();
