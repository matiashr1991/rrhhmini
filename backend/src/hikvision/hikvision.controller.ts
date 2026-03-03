import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { HikvisionPollerService } from './hikvision-poller.service';

@Controller('hikvision')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class HikvisionController {
    constructor(private readonly pollerService: HikvisionPollerService) { }

    /** GET /hikvision/status  — poller health and sync info */
    @Get('status')
    getStatus() {
        return this.pollerService.getStatus();
    }
}
