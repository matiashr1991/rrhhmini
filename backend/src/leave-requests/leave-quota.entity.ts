import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../employees/employee.entity';
import { LeaveType } from './leave-type.entity';

@Entity()
export class EmployeeLeaveQuota {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Employee, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;

    @ManyToOne(() => LeaveType, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'leaveTypeId' })
    leaveType: LeaveType;

    @Column({ type: 'int' })
    year: number;

    @Column({ type: 'int' })
    maxDays: number;
}
