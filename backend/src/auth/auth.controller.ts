import { Controller, Request, Post, Get, Put, Delete, Param, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Role } from './role.enum';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req) {
        return this.authService.login(req.user);
    }

    @Post('register')
    async register(@Body() body) {
        return this.authService.register(body.username, body.password, body.role);
    }

    @Get('users')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    getUsers() {
        return this.authService.getUsers();
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@Request() req) {
        return {
            userId: req.user.userId,
            username: req.user.username,
            role: req.user.role,
            employeeId: req.user.employeeId,
        };
    }

    @Post('users')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    createUserForEmployee(@Body() body: { username: string; password: string; role: string; employeeId: string }) {
        return this.authService.registerForEmployee(body.username, body.password, body.role, body.employeeId);
    }

    @Put('users/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    updateUser(@Param('id') id: string, @Body() body: { role: string; password?: string }) {
        return this.authService.updateUser(id, body);
    }

    @Delete('users/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    deleteUser(@Param('id') id: string) {
        return this.authService.deleteUser(id);
    }
}
