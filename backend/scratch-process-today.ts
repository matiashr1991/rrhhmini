import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AttendanceProcessorService } from './src/attendance/attendance-processor.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const processor = app.get(AttendanceProcessorService);

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    console.log(`Manually triggering processDay for ${todayStr}...`);
    await processor.processDay(todayStr);
    console.log('Done.');

    await app.close();
}

bootstrap();
