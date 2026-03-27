import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequest, LeaveStatus } from './leave-request.entity';
import { Employee } from '../employees/employee.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { EmployeesService } from '../employees/employees.service';
import { LeaveQuotasService } from './leave-quotas.service';

@Injectable()
export class LeaveRequestsService {
    constructor(
        @InjectRepository(LeaveRequest)
        private leaveRepository: Repository<LeaveRequest>,
        private notificationsService: NotificationsService,
        private employeesService: EmployeesService,
        private leaveQuotasService: LeaveQuotasService,
    ) { }

    async create(createLeaveDto: Partial<LeaveRequest>, employee: Employee): Promise<LeaveRequest & { quotaWarning?: string }> {
        if (!createLeaveDto.startDate || !createLeaveDto.endDate) {
            throw new BadRequestException('Fechas de inicio y fin son requeridas');
        }

        const hasConflict = await this.checkConflict(employee.id, createLeaveDto.startDate, createLeaveDto.endDate);
        if (hasConflict) {
            throw new BadRequestException('La solicitud se superpone con otra licencia existente.');
        }

        // employee object might only be a dummy ID from the controller
        const fullEmployee = await this.employeesService.findOne(employee.id);
        if (!fullEmployee) {
            throw new BadRequestException(`Empleado con ID ${employee.id} no encontrado. Verificar que el usuario esté vinculado a un empleado.`);
        }

        // --- Quota Validation ---
        // Calculate requested days
        const start = new Date(createLeaveDto.startDate).getTime();
        const end = new Date(createLeaveDto.endDate).getTime();
        const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
        const year = new Date(createLeaveDto.startDate).getFullYear();

        // Check against Quota
        const typeId = typeof createLeaveDto.type === 'object' ? createLeaveDto.type.id : (createLeaveDto as any).type;

        let quotaWarning: string | undefined;

        if (typeId) {
            const quotaInfo: any = await this.leaveQuotasService.getRemainingDays(employee.id, typeId, year);
            if (quotaInfo && quotaInfo.remainingDays < diffDays) {
                const excessDays = diffDays - Math.max(0, quotaInfo.remainingDays);
                // Check if this leave type allows exceeding
                if (quotaInfo.allowExceed) {
                    // Allow but warn
                    const limitLabel = quotaInfo.limitReason || `Anual (Máx ${quotaInfo.maxDays})`;
                    quotaWarning = `⚠️ Cupo excedido por ${excessDays} día(s). Límite: ${limitLabel}.`;
                } else {
                    if (quotaInfo.limitReason) {
                        throw new BadRequestException(`Cupo excedido. Límite aplicable: ${quotaInfo.limitReason}. Solés ${diffDays} día(s) pero te quedan ${quotaInfo.remainingDays} disponibles en este período.`);
                    }
                    throw new BadRequestException(`Cupo excedido. Solés ${diffDays} día(s) pero te quedan ${quotaInfo.remainingDays} de ${quotaInfo.maxDays} para el año ${year}.`);
                }
            }
        }
        // ------------------------

        const leave = this.leaveRepository.create({
            ...createLeaveDto,
            employee: fullEmployee,
            status: LeaveStatus.PENDING,
        });
        const savedLeave = await this.leaveRepository.save(leave);

        // Notify Admins
        await this.notificationsService.createNotification({
            title: 'Nueva Solicitud de Licencia',
            message: `${fullEmployee.firstName} ${fullEmployee.lastName} ha solicitado una licencia que requiere aprobación.${quotaWarning ? ' ' + quotaWarning : ''}`,
            type: 'LEAVE_REQUEST',
            referenceId: savedLeave.id.toString(),
            userId: null // Global admin alert
        });

        return { ...savedLeave, quotaWarning };
    }

    async checkConflict(employeeId: string, startDate: string, endDate: string): Promise<boolean> {
        const existing = await this.leaveRepository.createQueryBuilder('leave')
            .where('leave.employeeId = :employeeId', { employeeId })
            .andWhere('leave.status != :rejected', { rejected: LeaveStatus.REJECTED })
            .andWhere('((leave.startDate <= :endDate AND leave.endDate >= :startDate))', { startDate, endDate })
            .getOne();

        return !!existing;
    }

    async getApprovedLeave(employeeId: string, date: string): Promise<LeaveRequest | null> {
        return this.leaveRepository.createQueryBuilder('leave')
            .leftJoinAndSelect('leave.type', 'type')
            .where('leave.employeeId = :employeeId', { employeeId })
            .andWhere('leave.status = :approved', { approved: LeaveStatus.APPROVED })
            .andWhere(':date BETWEEN leave.startDate AND leave.endDate', { date })
            .getOne();
    }

    findAll(): Promise<LeaveRequest[]> {
        return this.leaveRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['employee', 'type'],
        });
    }

    findMyRequests(employeeId: string): Promise<LeaveRequest[]> {
        return this.leaveRepository.find({
            where: { employee: { id: employeeId } },
            order: { createdAt: 'DESC' },
            relations: ['type'],
        });
    }

    async findOne(id: number): Promise<LeaveRequest> {
        const leave = await this.leaveRepository.findOne({ where: { id }, relations: ['employee'] });
        if (!leave) throw new NotFoundException(`LeaveRequest with ID ${id} not found`);
        return leave;
    }

    async updateStatus(id: number, status: LeaveStatus, comment?: string): Promise<LeaveRequest> {
        const leave = await this.findOne(id);
        leave.status = status;
        if (comment) leave.comment = comment;
        const updatedLeave = await this.leaveRepository.save(leave);

        // Notify Employee if status changed to something final
        if (status === LeaveStatus.APPROVED || status === LeaveStatus.REJECTED) {
            const statusStr = status === LeaveStatus.APPROVED ? 'aprobada' : 'rechazada';
            await this.notificationsService.createNotification({
                title: `Licencia ${statusStr.toUpperCase()}`,
                message: `Tu solicitud de licencia ha sido ${statusStr}. ${comment ? 'Comentario: ' + comment : ''}`,
                type: 'LEAVE_STATUS_UPDATE',
                referenceId: updatedLeave.id.toString(),
                userId: leave.employee.id // Target specific employee
            });
        }

        return updatedLeave;
    }

    async deleteRequest(id: number): Promise<void> {
        await this.leaveRepository.delete(id);
    }
}
