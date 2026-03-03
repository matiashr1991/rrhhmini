import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../employees/employee.entity';

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', nullable: true })
    userId: string | null; // If null, it's a broadcast to all admins. If set, it's targeted to a specific employee (UUID).

    @Column()
    title: string;

    @Column()
    message: string;

    @Column()
    type: string; // e.g., 'LEAVE_REQUEST', 'LEAVE_APPROVED', 'ABSENCE_NOTICE'

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'varchar', nullable: true })
    referenceId: string | null; // Optional reference to an external entity like a LeaveRequest ID

    @ManyToOne(() => Employee, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    employee: Employee; // Optional relation just for DB consistency, though querying by userId is faster.
}
