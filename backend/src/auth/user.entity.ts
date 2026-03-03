import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Role } from './role.enum';
import { Employee } from '../employees/employee.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column()
    passwordHash: string;

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.EMPLOYEE,
    })
    role: Role;

    @OneToOne(() => Employee)
    @JoinColumn()
    employee: Employee;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
