import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class EmailConfig {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text', nullable: true })
    recipients: string; // Comma separated emails

    @Column({ default: '18:00' })
    scheduleTime: string; // HH:mm

    @Column({ default: false })
    isEnabled: boolean;

    @Column({ default: true })
    dailyReportEnabled: boolean;

    @Column({ default: false })
    monthlyReportEnabled: boolean;
}
