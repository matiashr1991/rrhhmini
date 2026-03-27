import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class LeaveType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: false })
    requiresApproval: boolean;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'int', nullable: true, default: null })
    maxDaysPerYear: number | null; // null = unlimited

    @Column({ type: 'int', nullable: true, default: null })
    maxDaysPerMonth: number | null; // null = no monthly cap

    @Column({ default: false })
    allowExceed: boolean; // If true, allows exceeding quota with a warning instead of blocking
}
