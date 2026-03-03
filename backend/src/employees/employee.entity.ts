import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Category } from './category.entity';
import { Jurisdiction } from './jurisdiction.entity';
import { AttendanceEvent } from '../attendance/attendance-event.entity';
import { MaritalStatus } from './marital-status.entity';
import { Gender } from './gender.entity';
import { OrganizationalUnit } from './organizational-unit.entity';
import { Grouping } from './grouping.entity';
import { PlantType1 } from './plant-type-1.entity';
import { PlantType2 } from './plant-type-2.entity';
import { FunctionArea } from './function-area.entity';
import { Workplace } from './workplace.entity';
import { RetirementStatus } from './retirement-status.entity';

@Entity()
export class Employee {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    employeeKey: string; // Legajo or internal ID from legacy system

    @Column({ unique: true, nullable: true })
    dni: string; // Número 8 dígitos

    @Column({ unique: true, nullable: true })
    legacyNumber: string; // Legajo Migrado (6 dígitos)

    @Column({ unique: true, nullable: true })
    cuit: string;

    @Column({ unique: true, nullable: true })
    fileNumber: string; // Nro de Carpeta (3 dígitos)

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @ManyToOne(() => Gender, { nullable: true })
    @JoinColumn({ name: 'genderId' })
    gender: Gender;

    @Column({ type: 'date', nullable: true })
    birthDate: Date;
    // Calculados en runtime: Edad

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @ManyToOne(() => MaritalStatus, { nullable: true })
    @JoinColumn({ name: 'maritalStatusId' })
    maritalStatus: MaritalStatus;

    @Column({ type: 'int', nullable: true, default: 0 })
    childrenCount: number;

    // Datos Laborales
    @Column({ type: 'date', nullable: true })
    entryDate: Date;
    // Calculados en runtime: Antigüedad, Meses, Días

    @ManyToOne(() => Jurisdiction, { nullable: true })
    @JoinColumn({ name: 'jurisdictionId' })
    jurisdiction: Jurisdiction;

    @ManyToOne(() => OrganizationalUnit, { nullable: true })
    @JoinColumn({ name: 'organizationalUnitId' })
    orgUnit: OrganizationalUnit;

    @ManyToOne(() => Category, { nullable: true })
    @JoinColumn({ name: 'categoryId' })
    category: Category;

    @ManyToOne(() => Grouping, { nullable: true })
    @JoinColumn({ name: 'groupingId' })
    grouping: Grouping;

    @ManyToOne(() => PlantType1, { nullable: true })
    @JoinColumn({ name: 'plantType1Id' })
    plantType1: PlantType1;

    @ManyToOne(() => PlantType2, { nullable: true })
    @JoinColumn({ name: 'plantType2Id' })
    plantType2: PlantType2;

    @Column({ nullable: true })
    workplaceLocation: string; // Lugar donde presta servicio (Texto)

    // Datos de Función
    @Column({ nullable: true })
    functionNumber: string; // Número de Función (4 dígitos)

    @Column({ nullable: true })
    functionDescription: string; // Descripción Función

    @ManyToOne(() => FunctionArea, { nullable: true })
    @JoinColumn({ name: 'functionAreaId' })
    functionArea: FunctionArea;

    @Column({ nullable: true })
    designationDevice: string; // Dispositivo Designación

    @ManyToOne(() => Workplace, { nullable: true })
    @JoinColumn({ name: 'workplaceId' })
    workplace: Workplace; // Lugar presta servicio (Lista)

    // Sumario y Legales
    @Column({ default: false })
    hasSummary: boolean; // Sumario (SI-NO)

    @Column({ type: 'date', nullable: true })
    summaryStartDate: Date; // Fecha Inicio Sumario

    @Column({ nullable: true })
    summaryFileNumber: string; // Número Expediente Sumario

    // Jubilación
    @ManyToOne(() => RetirementStatus, { nullable: true })
    @JoinColumn({ name: 'retirementStatusId' })
    retirementStatus: RetirementStatus;

    @Column({ nullable: true })
    retirementFileNumber: string; // Expediente Jubilación

    // Otros
    @Column({ default: false })
    hasDigitalSignature: boolean; // Firma Digital (SI-NO)

    @Column({ type: 'date', nullable: true })
    lastRecategorizationDate: Date; // Última Fecha Recategorización

    // Relations
    @OneToMany(() => AttendanceEvent, (event) => event.employee)
    attendanceEvents: AttendanceEvent[];

    @Column({ default: true })
    isActive: boolean;
}
