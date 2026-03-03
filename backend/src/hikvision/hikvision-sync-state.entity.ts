import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Stores the byte-offset cursor for the incremental pull from the
 * Hikvision VPS API (events_ingest.jsonl).
 *
 * Only one row exists (key = 'default').
 */
@Entity({ name: 'hikvision_sync_state' })
export class HikvisionSyncState {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: 'default', unique: true })
    key: string;

    /** Byte offset inside events_ingest.jsonl on the VPS */
    @Column({ type: 'bigint', default: 0 })
    cursor: number;

    /** ISO timestamp of the last event dateTime we processed */
    @Column({ nullable: true })
    lastEventDateTime: string;

    /** ISO timestamp of last successful poll */
    @Column({ nullable: true })
    lastPollAt: string;

    /** Total events ingested since last reset */
    @Column({ default: 0 })
    totalIngested: number;
}
