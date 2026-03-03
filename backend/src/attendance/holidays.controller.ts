import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { Holiday } from './holiday.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller('holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HolidaysController {
    constructor(private readonly holidaysService: HolidaysService) { }

    @Get()
    @Roles(Role.ADMIN)
    findAll() {
        return this.holidaysService.findAll();
    }

    @Post()
    @Roles(Role.ADMIN)
    create(@Body() holidayData: Partial<Holiday>) {
        return this.holidaysService.create(holidayData);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    remove(@Param('id') id: string) {
        return this.holidaysService.remove(+id);
    }
}
