import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Jurisdiction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    code: string; // e.g., "8" for Ministerio de Ecología

    @Column()
    name: string;
}
