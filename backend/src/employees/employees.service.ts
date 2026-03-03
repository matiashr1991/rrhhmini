import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { Category } from './category.entity';
import { Jurisdiction } from './jurisdiction.entity';
import { MaritalStatus } from './marital-status.entity';
import { Gender } from './gender.entity';
import { OrganizationalUnit } from './organizational-unit.entity';
import { Grouping } from './grouping.entity';
import { PlantType1 } from './plant-type-1.entity';
import { PlantType2 } from './plant-type-2.entity';
import { FunctionArea } from './function-area.entity';
import { Workplace } from './workplace.entity';
import { RetirementStatus } from './retirement-status.entity';

@Injectable()
export class EmployeesService {
    constructor(
        @InjectRepository(Employee) private employeesRepository: Repository<Employee>,
        @InjectRepository(Category) private categoriesRepository: Repository<Category>,
        @InjectRepository(Jurisdiction) private jurisdictionsRepository: Repository<Jurisdiction>,
        @InjectRepository(MaritalStatus) private maritalStatusRepository: Repository<MaritalStatus>,
        @InjectRepository(Gender) private genderRepository: Repository<Gender>,
        @InjectRepository(OrganizationalUnit) private orgUnitRepository: Repository<OrganizationalUnit>,
        @InjectRepository(Grouping) private groupingRepository: Repository<Grouping>,
        @InjectRepository(PlantType1) private plantType1Repository: Repository<PlantType1>,
        @InjectRepository(PlantType2) private plantType2Repository: Repository<PlantType2>,
        @InjectRepository(FunctionArea) private functionAreaRepository: Repository<FunctionArea>,
        @InjectRepository(Workplace) private workplaceRepository: Repository<Workplace>,
        @InjectRepository(RetirementStatus) private retirementStatusRepository: Repository<RetirementStatus>,
    ) { }

    findAll(): Promise<Employee[]> {
        return this.employeesRepository.find({
            relations: [
                'category', 'jurisdiction', 'gender', 'maritalStatus',
                'orgUnit', 'grouping', 'plantType1', 'plantType2',
                'functionArea', 'workplace', 'retirementStatus'
            ]
        });
    }

    findOne(id: string): Promise<Employee | null> {
        return this.employeesRepository.findOne({
            where: { id },
            relations: [
                'category', 'jurisdiction', 'gender', 'maritalStatus',
                'orgUnit', 'grouping', 'plantType1', 'plantType2',
                'functionArea', 'workplace', 'retirementStatus'
            ],
        });
    }

    findByEmployeeKey(employeeKey: string): Promise<Employee | null> {
        return this.employeesRepository.findOne({ where: { employeeKey } });
    }

    findByDni(dni: string): Promise<Employee | null> {
        return this.employeesRepository.findOne({ where: { dni } });
    }

    create(employee: Partial<Employee>): Promise<Employee> {
        return this.employeesRepository.save(this.employeesRepository.create(employee));
    }

    async update(id: string, employee: Partial<Employee>): Promise<Employee | null> {
        // Using save() instead of update() to avoid ER_DUP_ENTRY on UNIQUE fields 
        // (employeeKey, dni, etc.) when the values haven't actually changed.
        const existing = await this.employeesRepository.findOne({ where: { id } });
        if (!existing) return null;
        const merged = this.employeesRepository.merge(existing, employee);
        await this.employeesRepository.save(merged);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.employeesRepository.update(id, { isActive: false });
    }

    async getParametrics() {
        const [
            categories, jurisdictions, maritalStatuses, genders,
            orgUnits, groupings, plantType1s, plantType2s,
            functionAreas, workplaces, retirementStatuses
        ] = await Promise.all([
            this.categoriesRepository.find(),
            this.jurisdictionsRepository.find(),
            this.maritalStatusRepository.find(),
            this.genderRepository.find(),
            this.orgUnitRepository.find(),
            this.groupingRepository.find(),
            this.plantType1Repository.find(),
            this.plantType2Repository.find(),
            this.functionAreaRepository.find(),
            this.workplaceRepository.find(),
            this.retirementStatusRepository.find(),
        ]);

        return {
            categories, jurisdictions, maritalStatuses, genders,
            orgUnits, groupings, plantType1s, plantType2s,
            functionAreas, workplaces, retirementStatuses
        };
    }

    private getRepositoryByType(type: string): Repository<any> {
        switch (type) {
            case 'categories': return this.categoriesRepository;
            case 'jurisdictions': return this.jurisdictionsRepository;
            case 'maritalStatuses': return this.maritalStatusRepository;
            case 'genders': return this.genderRepository;
            case 'orgUnits': return this.orgUnitRepository;
            case 'groupings': return this.groupingRepository;
            case 'plantType1s': return this.plantType1Repository;
            case 'plantType2s': return this.plantType2Repository;
            case 'functionAreas': return this.functionAreaRepository;
            case 'workplaces': return this.workplaceRepository;
            case 'retirementStatuses': return this.retirementStatusRepository;
            default: throw new Error(`Parametric type '${type}' not found.`);
        }
    }

    async createParametric(type: string, data: any) {
        const repo = this.getRepositoryByType(type);
        const entity = repo.create(data);
        return await repo.save(entity);
    }

    async updateParametric(type: string, id: string | number, data: any) {
        const repo = this.getRepositoryByType(type);
        await repo.update(id, data);
        return await repo.findOne({ where: { id } });
    }

    async removeParametric(type: string, id: string | number) {
        const repo = this.getRepositoryByType(type);
        await repo.delete(id);
    }
}
