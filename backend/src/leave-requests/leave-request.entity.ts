import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Employee } from '../employees/employee.entity';
import { LeaveType } from './leave-type.entity';

export enum LeaveStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

@Entity()
export class LeaveRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Employee, { eager: true })
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;

    @ManyToOne(() => LeaveType, { eager: true })
    @JoinColumn({ name: 'typeId' })
    type: LeaveType;

    @Column({ type: 'date' })
    startDate: string;

    @Column({ type: 'date' })
    endDate: string;

    @Column()
    reason: string; // Motivo (Enfermedad, Vacaciones, etc.)

    @Column({
        type: 'enum',
        enum: LeaveStatus,
        default: LeaveStatus.PENDING,
    })
    status: LeaveStatus;

    @Column({ nullable: true })
    comment: string; // Comentario del administrativo al aprobar/rechazar

    @CreateDateColumn()
    createdAt: Date;
}
