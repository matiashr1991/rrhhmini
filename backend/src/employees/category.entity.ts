import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    level: number; // 1-30

    @Column()
    description: string;

    @Column({ nullable: true })
    grouping: string; // Agrupamiento
}
