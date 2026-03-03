import { Controller, Get, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get('unread')
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE, Role.EMPLOYEE)
    getUnread(@Request() req, @Query('target') target: string) {
        // If employee, they can only get their own info
        if (req.user.role === Role.EMPLOYEE || target === 'employee') {
            return this.notificationsService.getUnread(req.user.userId);
        }

        // Admins requesting 'admin' alerts get the global ones
        return this.notificationsService.getUnread();
    }

    @Patch(':id/read')
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE, Role.EMPLOYEE)
    markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Patch('read-all')
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE, Role.EMPLOYEE)
    markAllAsRead(@Request() req, @Query('target') target: string) {
        if (req.user.role === Role.EMPLOYEE || target === 'employee') {
            return this.notificationsService.markAllAsRead(req.user.userId);
        }
        return this.notificationsService.markAllAsRead();
    }
}
