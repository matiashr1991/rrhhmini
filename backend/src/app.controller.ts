import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { Role } from './auth/role.enum';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * GET /maintenance/status — public, no auth
   * Frontend checks this to decide whether to show maintenance page
   */
  @Get('maintenance/status')
  getMaintenanceStatus() {
    return this.appService.getMaintenanceStatus();
  }

  /**
   * POST /maintenance/toggle — admin only
   * Body: { enabled: true/false, message?: string }
   */
  @Post('maintenance/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  toggleMaintenance(@Body() body: { enabled: boolean; message?: string }) {
    return this.appService.setMaintenance(body.enabled, body.message);
  }
}
