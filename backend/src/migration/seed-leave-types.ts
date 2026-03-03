import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { LeaveType } from '../leave-requests/leave-type.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const repo = dataSource.getRepository(LeaveType);

    console.log('Seeding Leave Types...');

    const types = [
        { name: 'Licencia por Enfermedad', requiresApproval: false, description: 'Licencia médica (Corto Tratamiento)' },
        { name: 'Aviso de Falta', requiresApproval: false, description: 'Aviso por razones particulares o imprevistos' },
        { name: 'Vacaciones', requiresApproval: true, description: 'Licencia anual ordinaria' },
        { name: 'Día de Estudio', requiresApproval: true, description: 'Para rendir examen' },
    ];

    for (const t of types) {
        const exists = await repo.findOne({ where: { name: t.name } });
        if (!exists) {
            await repo.save(repo.create(t));
            console.log(`Created LeaveType: ${t.name}`);
        }
    }

    console.log('Seeding complete.');
    await app.close();
}

bootstrap();
