import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';
import { AuditAction } from './audit-log.entity';

/**
 * Interceptor global que registra automáticamente todas las operaciones
 * mutantes (POST, PUT, PATCH, DELETE) en el audit log.
 *
 * Extrae el usuario del JWT (req.user), la IP, y determina la acción
 * según el método HTTP y la ruta.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private readonly auditService: AuditService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const method = request.method;

        // Solo loguear operaciones mutantes
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            return next.handle();
        }

        // No loguear la ruta de login (se maneja explícitamente en AuthController)
        if (request.url?.includes('/auth/login')) {
            return next.handle();
        }

        const user = request.user;
        // Si no hay usuario autenticado (ruta pública), no loguear
        if (!user) {
            return next.handle();
        }

        const startTime = Date.now();

        return next.handle().pipe(
            tap({
                next: (responseBody) => {
                    const action = this.resolveAction(method, request.url, request.body);
                    const entity = this.resolveEntity(request.url);
                    const entityId = this.resolveEntityId(request.url, request.params, responseBody);

                    this.auditService.log({
                        userId: user.userId,
                        username: user.username,
                        action,
                        entity,
                        entityId,
                        details: this.buildDetails(method, request.body, request.url, responseBody),
                        ipAddress: request.ip || request.headers['x-forwarded-for'] || 'unknown',
                        userAgent: request.headers['user-agent'] || 'unknown',
                    });
                },
                error: () => {
                    // No loguear operaciones que fallaron
                },
            }),
        );
    }

    /**
     * Determina la acción de auditoría según método HTTP y ruta.
     */
    private resolveAction(method: string, url: string, body?: any): AuditAction {
        // Detectar aprobación/rechazo de licencias
        if (url.includes('/leave-requests/') && url.includes('/status')) {
            if (body?.status === 'APPROVED') return AuditAction.APPROVE;
            if (body?.status === 'REJECTED') return AuditAction.REJECT;
            return AuditAction.UPDATE;
        }

        switch (method) {
            case 'POST': return AuditAction.CREATE;
            case 'PUT':
            case 'PATCH': return AuditAction.UPDATE;
            case 'DELETE': return AuditAction.DELETE;
            default: return AuditAction.UPDATE;
        }
    }

    /**
     * Extrae el nombre de la entidad desde la URL.
     * /employees → Employee, /leave-requests → LeaveRequest, etc.
     */
    private resolveEntity(url: string): string {
        // Remove query string and leading slash
        const path = url.split('?')[0].replace(/^\//, '');
        const segment = path.split('/')[0]; // First path segment

        const entityMap: Record<string, string> = {
            'employees': 'Employee',
            'leave-requests': 'LeaveRequest',
            'leave-types': 'LeaveType',
            'leave-quotas': 'LeaveQuota',
            'attendance': 'Attendance',
            'notifications': 'Notification',
            'users': 'User',
            'auth': 'Auth',
            'reports': 'Report',
            'audit-logs': 'AuditLog',
            // Paramétricas
            'categories': 'Category',
            'jurisdictions': 'Jurisdiction',
            'groupings': 'Grouping',
            'genders': 'Gender',
            'marital-statuses': 'MaritalStatus',
            'organizational-units': 'OrgUnit',
            'plant-type-1': 'PlantType1',
            'plant-type-2': 'PlantType2',
            'function-areas': 'FunctionArea',
            'workplaces': 'Workplace',
            'retirement-statuses': 'RetirementStatus',
            'holidays': 'Holiday',
            'email-config': 'EmailConfig',
        };

        return entityMap[segment] || segment;
    }

    /**
     * Intenta extraer el ID del registro afectado.
     */
    private resolveEntityId(url: string, params: any, responseBody: any): string {
        // From URL params (e.g., /employees/abc-123)
        if (params?.id) return String(params.id);

        // From URL path segments
        const parts = url.split('?')[0].split('/').filter(Boolean);
        if (parts.length >= 2 && parts[1] !== 'status') {
            return parts[1];
        }

        // From response body (for POST/CREATE)
        if (responseBody?.id) return String(responseBody.id);

        return '';
    }

    /**
     * Construye los detalles a guardar (sanitizados).
     */
    private buildDetails(
        method: string,
        body: any,
        url: string,
        responseBody?: any,
    ): Record<string, any> {
        const details: Record<string, any> = {};

        if (body && typeof body === 'object') {
            // Copiar body pero omitir campos sensibles
            const sanitized = { ...body };
            delete sanitized.password;
            delete sanitized.passwordHash;
            delete sanitized.token;
            delete sanitized.access_token;
            details.input = sanitized;
        }

        // Para updates, guardar la URL completa como referencia
        details.url = url;

        return details;
    }
}
