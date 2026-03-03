import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { Employee } from './employee.entity';
import { Category } from './category.entity';
import { Jurisdiction } from './jurisdiction.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
    constructor(private readonly employeesService: EmployeesService) { }

    @Get()
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE)
    findAll(): Promise<Employee[]> {
        return this.employeesService.findAll();
    }

    @Get('parametrics')
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE)
    getParametrics() {
        return this.employeesService.getParametrics();
    }

    @Post('parametrics/:type')
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE)
    createParametric(@Param('type') type: string, @Body() data: any) {
        return this.employeesService.createParametric(type, data);
    }

    @Put('parametrics/:type/:id')
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE)
    updateParametric(@Param('type') type: string, @Param('id') id: string, @Body() data: any) {
        return this.employeesService.updateParametric(type, id, data);
    }

    @Delete('parametrics/:type/:id')
    @Roles(Role.ADMIN)
    removeParametric(@Param('type') type: string, @Param('id') id: string) {
        return this.employeesService.removeParametric(type, id);
    }

    @Get('by-dni/:dni')
    @Roles(Role.ADMIN)
    findByDni(@Param('dni') dni: string): Promise<Employee | null> {
        return this.employeesService.findByDni(dni);
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE, Role.EMPLOYEE)
    findOne(@Param('id') id: string): Promise<Employee | null> {
        return this.employeesService.findOne(id);
    }

    @Post()
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE)
    create(@Body() employee: Employee): Promise<Employee> {
        return this.employeesService.create(employee);
    }

    @Put(':id')
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE)
    update(@Param('id') id: string, @Body() employee: Employee): Promise<Employee | null> {
        return this.employeesService.update(id, employee);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    remove(@Param('id') id: string): Promise<void> {
        return this.employeesService.remove(id);
    }
}
