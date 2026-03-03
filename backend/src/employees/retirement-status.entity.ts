import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class RetirementStatus {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ default: true })
    isActive: boolean;
}
