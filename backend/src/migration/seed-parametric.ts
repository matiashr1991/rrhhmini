import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Category } from '../employees/category.entity';
import { Jurisdiction } from '../employees/jurisdiction.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const cateRepo = dataSource.getRepository(Category);
    const jurisRepo = dataSource.getRepository(Jurisdiction); // Fixed variable name from juriRepo

    console.log('Seeding parametric data...');

    // Seed Categories
    const categories = [
        { level: 1, description: 'Planta Permanente', grouping: 'Administrativo' },
        { level: 2, description: 'Contrato', grouping: 'Servicios' },
        { level: 3, description: 'Gabinete', grouping: 'Político' },
        { level: 4, description: 'Pasantía', grouping: 'Formación' }
    ];

    for (const cat of categories) {
        const exists = await cateRepo.findOne({ where: { description: cat.description } });
        if (!exists) {
            await cateRepo.save(cateRepo.create(cat));
            console.log(`Created Category: ${cat.description}`);
        }
    }

    // Seed Jurisdictions
    const jurisdictions = [
        { code: '1', name: 'Administración Central' },
        { code: '2', name: 'Obras Públicas' },
        { code: '3', name: 'Salud' },
        { code: '4', name: 'Desarrollo Social' }
    ];

    for (const juris of jurisdictions) {
        const exists = await jurisRepo.findOne({ where: { code: juris.code } });
        if (!exists) {
            await jurisRepo.save(jurisRepo.create(juris));
            console.log(`Created Jurisdiction: ${juris.name}`);
        }
    }

    console.log('Seeding complete.');
    await app.close();
}

bootstrap();
