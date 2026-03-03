import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
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

@Module({
    imports: [TypeOrmModule.forFeature([
        Employee, Category, Jurisdiction, MaritalStatus, Gender,
        OrganizationalUnit, Grouping, PlantType1, PlantType2,
        FunctionArea, Workplace, RetirementStatus
    ])],
    providers: [EmployeesService],
    controllers: [EmployeesController],
    exports: [EmployeesService],
})
export class EmployeesModule { }
