import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Employee } from '../employees/employee.entity';

export enum EventType {
    IN = 'IN',
    OUT = 'OUT',
    UNKNOWN = 'UNKNOWN',
}

@Entity()
export class AttendanceEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Employee, (employee) => employee.attendanceEvents)
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;

    @Index()
    @Column({ type: 'datetime' })
    timestamp: Date;

    @Column({ nullable: true })
    deviceId: string;

    @Column({
        type: 'enum',
        enum: EventType,
        default: EventType.UNKNOWN,
    })
    type: EventType;

    @Column({ nullable: true })
    serialNo: number;

    @Column({ nullable: true })
    eventCode: number; // majorEventType or subEventType

    @Column({ type: 'json', nullable: true })
    rawData: any; // Store original JSON payload for audit

    @Column({ default: false })
    isProcessed: boolean;
}
