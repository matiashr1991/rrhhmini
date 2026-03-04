import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AuditAction {
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
    EXPORT = 'EXPORT',
}

@Entity('audit_log')
@Index(['createdAt'])
@Index(['userId'])
@Index(['action'])
@Index(['entity'])
export class AuditLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    userId: string;

    @Column()
    username: string;

    @Column({
        type: 'enum',
        enum: AuditAction,
    })
    action: AuditAction;

    @Column({ nullable: true })
    entity: string; // 'Employee', 'LeaveRequest', 'User', etc.

    @Column({ nullable: true })
    entityId: string; // ID del registro afectado

    @Column({ type: 'json', nullable: true })
    details: Record<string, any>; // Cambios, valores anteriores, etc.

    @Column({ nullable: true })
    ipAddress: string;

    @Column({ nullable: true })
    userAgent: string;

    @CreateDateColumn()
    createdAt: Date;
}
