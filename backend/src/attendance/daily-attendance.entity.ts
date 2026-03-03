import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { Employee } from '../employees/employee.entity';

@Entity()
@Unique(['employee', 'date']) // One record per employee per day
export class DailyAttendance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;

    @Column({ type: 'date' })
    @Index()
    date: string; // YYYY-MM-DD

    @Column({ type: 'datetime', nullable: true })
    inTime: Date | null;

    @Column({ type: 'datetime', nullable: true })
    outTime: Date | null;

    @Column({ type: 'float', default: 0 })
    hoursWorked: number;

    @Column({ default: false })
    isLate: boolean;

    @Column({
        type: 'enum',
        enum: ['PRESENT', 'ABSENT', 'LICENSE', 'HOLIDAY', 'OFF'],
        default: 'ABSENT'
    })
    status: string;

    // Deprecated, keeping for temporary compatibility, will be synced with status
    @Column({ default: false })
    isAbsent: boolean;

    @Column({ type: 'json', nullable: true })
    meta: any; // Extra info like specific events IDs used
}
