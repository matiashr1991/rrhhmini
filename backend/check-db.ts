import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DailyAttendance } from './src/attendance/daily-attendance.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const repo = app.get<Repository<DailyAttendance>>(getRepositoryToken(DailyAttendance));

    const todayStr = '2026-04-21';
    const records = await repo.find({ where: { date: todayStr } });

    console.log(`Records for ${todayStr}: ${records.length}`);
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const license = records.filter(r => r.status === 'LICENSE').length;

    console.log(`Present: ${present}`);
    console.log(`Absent: ${absent}`);
    console.log(`License: ${license}`);

    if (records.length > 0) {
        console.log('Sample record:', records[0]);
    }

    await app.close();
}

bootstrap();
