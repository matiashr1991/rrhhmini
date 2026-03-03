import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveType } from './leave-type.entity';

@Injectable()
export class LeaveTypesService {
    constructor(
        @InjectRepository(LeaveType)
        private repo: Repository<LeaveType>,
    ) { }

    findAll(): Promise<LeaveType[]> {
        return this.repo.find({ where: { isActive: true } });
    }

    create(leaveType: Partial<LeaveType>): Promise<LeaveType> {
        return this.repo.save(this.repo.create(leaveType));
    }

    async update(id: number, leaveType: Partial<LeaveType>): Promise<LeaveType> {
        await this.repo.update(id, leaveType);
        const updated = await this.repo.findOne({ where: { id } });
        if (!updated) throw new Error('Leave type not found');
        return updated;
    }

    async softDelete(id: number): Promise<void> {
        await this.repo.update(id, { isActive: false });
    }
}
