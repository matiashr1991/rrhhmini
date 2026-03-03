import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class FunctionArea {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ default: true })
    isActive: boolean;
}
