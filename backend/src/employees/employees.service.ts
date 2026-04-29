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
            order: { lastName: 'ASC', firstName: 'ASC' },
            relations: [
                'category', 'jurisdiction', 'gender', 'maritalStatus',
                'orgUnit', 'grouping', 'plantType1', 'plantType2',
                'functionArea', 'workplace', 'retirementStatus'
            ]
        });
    }

    findAllActive(): Promise<Employee[]> {
        return this.employeesRepository.find({
            where: { isActive: true },
            order: { lastName: 'ASC', firstName: 'ASC' },
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

    async findByEmployeeKey(employeeKey: string): Promise<Employee | null> {
        // First try exact match on employeeKey (legajo)
        const byKey = await this.employeesRepository.findOne({ where: { employeeKey } });
        if (byKey) return byKey;

        // Fallback: try matching by DNI (the device may still send the old DNI as identifier)
        const byDni = await this.employeesRepository.findOne({ where: { dni: employeeKey } });
        return byDni;
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

    async toggleActive(id: string): Promise<Employee | null> {
        const emp = await this.employeesRepository.findOne({ where: { id } });
        if (!emp) return null;
        emp.isActive = !emp.isActive;
        await this.employeesRepository.save(emp);
        return this.findOne(id);
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

    /**
     * Limpia el payload genérico del frontend ({name, description}) para 
     * enviar solo los campos que corresponden a cada tipo de entidad.
     * - Category → description (no tiene name) y opcionalmente level si es numérico
     * - Jurisdiction → name y code
     * - Todas las demás → name
     */
    private cleanParametricData(type: string, data: any): any {
        const value = data.description || data.name || '';
        switch (type) {
            case 'categories':
                const catData: any = { description: value };
                const numValue = parseInt(value, 10);
                if (!isNaN(numValue)) {
                    catData.level = numValue;
                }
                return catData;
            case 'jurisdictions':
                // Si el usuario ingresa "1 - Central", usamos 1 como code y Central como name
                if (value.includes(' - ')) {
                    const [code, ...nameParts] = value.split(' - ');
                    return {
                        code: code.trim(),
                        name: nameParts.join(' - ').trim()
                    };
                }
                return { code: value, name: value };
            default:
                // Gender, MaritalStatus, OrgUnit, Grouping, PlantType1, PlantType2,
                // FunctionArea, Workplace, RetirementStatus — all use 'name'
                return { name: value };
        }
    }

    async createParametric(type: string, data: any) {
        const repo = this.getRepositoryByType(type);
        const cleanData = this.cleanParametricData(type, data);

        // Lógica de auto-asignación para campos obligatorios faltantes
        if (type === 'categories' && cleanData.level === undefined) {
            const maxLevelObj = await repo
                .createQueryBuilder('category')
                .select('MAX(category.level)', 'max')
                .getRawOne();
            cleanData.level = (Number(maxLevelObj?.max) || 0) + 1;
        }

        const entity = repo.create(cleanData);
        return await repo.save(entity);
    }

    async updateParametric(type: string, id: string | number, data: any) {
        const repo = this.getRepositoryByType(type);
        const cleanData = this.cleanParametricData(type, data);
        await repo.update(id, cleanData);
        return await repo.findOne({ where: { id: id as any } });
    }

    async removeParametric(type: string, id: string | number) {
        const repo = this.getRepositoryByType(type);
        await repo.delete(id);
    }
}
