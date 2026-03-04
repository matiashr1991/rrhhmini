import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, FindOptionsWhere } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

export interface AuditLogInput {
    userId?: string;
    username: string;
    action: AuditAction;
    entity?: string;
    entityId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

export interface AuditLogFilters {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    userId?: string;
    action?: AuditAction;
    entity?: string;
    search?: string;
}

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditRepo: Repository<AuditLog>,
    ) { }

    /**
     * Registra una acción en el log de auditoría.
     * Nunca lanza excepción — el audit no debe romper la operación principal.
     */
    async log(input: AuditLogInput): Promise<void> {
        try {
            const entry = this.auditRepo.create(input);
            await this.auditRepo.save(entry);
        } catch (error) {
            console.error('[AuditService] Error saving audit log:', error.message);
        }
    }

    /**
     * Consulta paginada con filtros.
     */
    async findAll(filters: AuditLogFilters) {
        const {
            page = 1,
            limit = 50,
            startDate,
            endDate,
            userId,
            action,
            entity,
            search,
        } = filters;

        const where: FindOptionsWhere<AuditLog> = {};

        if (userId) where.userId = userId;
        if (action) where.action = action;
        if (entity) where.entity = entity;

        if (startDate && endDate) {
            where.createdAt = Between(
                new Date(startDate + 'T00:00:00'),
                new Date(endDate + 'T23:59:59'),
            );
        } else if (startDate) {
            where.createdAt = Between(
                new Date(startDate + 'T00:00:00'),
                new Date('2099-12-31'),
            );
        }

        const queryBuilder = this.auditRepo.createQueryBuilder('log');

        // Apply where conditions
        if (userId) queryBuilder.andWhere('log.userId = :userId', { userId });
        if (action) queryBuilder.andWhere('log.action = :action', { action });
        if (entity) queryBuilder.andWhere('log.entity = :entity', { entity });
        if (startDate) queryBuilder.andWhere('log.createdAt >= :startDate', { startDate: startDate + ' 00:00:00' });
        if (endDate) queryBuilder.andWhere('log.createdAt <= :endDate', { endDate: endDate + ' 23:59:59' });
        if (search) {
            queryBuilder.andWhere(
                '(log.username LIKE :search OR log.entityId LIKE :search OR log.entity LIKE :search)',
                { search: `%${search}%` },
            );
        }

        const skip = (page - 1) * limit;

        const [data, total] = await queryBuilder
            .orderBy('log.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
