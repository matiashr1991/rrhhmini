import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Holiday } from './holiday.entity';

@Injectable()
export class HolidaysService {
    constructor(
        @InjectRepository(Holiday)
        private holidaysRepository: Repository<Holiday>,
    ) { }

    findAll(): Promise<Holiday[]> {
        return this.holidaysRepository.find({ order: { date: 'DESC' } });
    }

    async findByDate(date: string): Promise<Holiday | null> {
        return this.holidaysRepository.findOne({ where: { date } });
    }

    create(holidayData: Partial<Holiday>): Promise<Holiday> {
        const holiday = this.holidaysRepository.create(holidayData);
        return this.holidaysRepository.save(holiday);
    }

    async remove(id: number): Promise<void> {
        await this.holidaysRepository.delete(id);
    }
}
