import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private maintenanceEnabled = false;
  private maintenanceMessage = 'El sistema se encuentra en mantenimiento. Por favor, intentá más tarde.';

  getHello(): string {
    return 'Hello World!';
  }

  getMaintenanceStatus() {
    return {
      enabled: this.maintenanceEnabled,
      message: this.maintenanceMessage,
    };
  }

  setMaintenance(enabled: boolean, message?: string) {
    this.maintenanceEnabled = enabled;
    if (message) this.maintenanceMessage = message;
    return this.getMaintenanceStatus();
  }
}
