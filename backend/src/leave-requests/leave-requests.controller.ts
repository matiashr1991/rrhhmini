import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveRequest, LeaveStatus } from './leave-request.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveRequestsController {
    constructor(private readonly leaveService: LeaveRequestsService) { }

    @Get('my-requests')
    @Roles(Role.EMPLOYEE, Role.ADMIN) // Admin might want to test
    findMyRequests(@Request() req) {
        // If user is employee, filter by their ID.
        // We rely on the populated user object from JwtStrategy/AuthService, 
        // but JwtStrategy currently might only have payload.
        // Payload has employeeId (we added it in AuthService login).

        // We need to ensure JwtStrategy puts payload into req.user
        return this.leaveService.findMyRequests(req.user.employeeId);
    }

    @Post()
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.ADMINISTRATIVE)
    async create(@Body() body: any, @Request() req) {
        const { employeeId, ...data } = body;

        let targetEmployeeId = req.user.role === Role.EMPLOYEE ? req.user.employeeId : employeeId;

        // Validation for Admin/Administrative: must provide employeeId if acting on behalf of someone
        if ((req.user.role === Role.ADMIN || req.user.role === Role.ADMINISTRATIVE) && !targetEmployeeId) {
            // If they didn't provide it, maybe they want to create for themselves? 
            // Let's assume they must provide it or fallback to themselves if they have an employeeId.
            targetEmployeeId = req.user.employeeId;
        }

        if (!targetEmployeeId) {
            throw new BadRequestException(
                'Tu usuario de sistema no está vinculado a un empleado. '
                + 'Pedile al administrador que recree tu usuario desde Configuración → Usuarios del Sistema.'
            );
        }

        return this.leaveService.create(data, { id: targetEmployeeId } as any);
    }

    @Get()
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE)
    findAll() {
        return this.leaveService.findAll();
    }

    @Patch(':id/status')
    @Roles(Role.ADMIN, Role.ADMINISTRATIVE)
    updateStatus(
        @Param('id') id: string,
        @Body() body: { status: LeaveStatus; comment?: string },
    ) {
        return this.leaveService.updateStatus(+id, body.status, body.comment);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    deleteRequest(@Param('id') id: string) {
        return this.leaveService.deleteRequest(+id);
    }
}
