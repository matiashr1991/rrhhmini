import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HikvisionSyncState } from './hikvision-sync-state.entity';
import { AttendanceEvent, EventType } from '../attendance/attendance-event.entity';
import { EmployeesService } from '../employees/employees.service';

interface HikEvent {
    serialNo: number;
    dateTime: string;
    deviceMs: number;
    day: string;
    receivedAt: string;
    receivedAtMs: number;
    employeeKey: string;
    employeeNoString: string;
    name: string;
    deviceIp: string;
    macAddress: string;
    channelID: number;
    major: number;
    sub: number;
    isDenied: boolean;
    cardNo: string | null;
    employeeNo: number | null;
}

interface PollResponse {
    ok: boolean;
    items: HikEvent[];
    nextCursor: number;
    hasMore: boolean;
}

@Injectable()
export class HikvisionPollerService implements OnModuleInit {
    private readonly logger = new Logger(HikvisionPollerService.name);
    private running = false;

    private readonly apiBase: string;
    private readonly apiKey: string;
    private readonly pollIntervalMs: number;
    private readonly pollLimit: number;

    constructor(
        @InjectRepository(HikvisionSyncState)
        private stateRepo: Repository<HikvisionSyncState>,
        @InjectRepository(AttendanceEvent)
        private eventsRepo: Repository<AttendanceEvent>,
        private employeesService: EmployeesService,
        private config: ConfigService,
    ) {
        this.apiBase = this.config.get<string>('HIK_API_BASE', 'https://mhikapi.mmatdev.com');
        this.apiKey = this.config.get<string>('HIK_API_KEY', '');
        this.pollIntervalMs = this.config.get<number>('HIK_POLL_INTERVAL_MS', 30000);
        this.pollLimit = this.config.get<number>('HIK_POLL_LIMIT', 200);
    }

    async onModuleInit() {
        if (!this.apiKey) {
            this.logger.warn('HIK_API_KEY not configured — Hikvision poller disabled.');
            return;
        }
        this.logger.log(`Hikvision poller starting. Base: ${this.apiBase} Interval: ${this.pollIntervalMs}ms`);
        // Start the loop asynchronously — don't block module init
        this.pollLoop().catch(err => this.logger.error('Poll loop crashed:', err));
    }

    // ── Public status endpoint ──────────────────────────────────────────────
    async getStatus() {
        const state = await this.getOrCreateState();
        return {
            cursor: state.cursor,
            lastEventDateTime: state.lastEventDateTime,
            lastPollAt: state.lastPollAt,
            totalIngested: state.totalIngested,
        };
    }

    // ── Main loop ───────────────────────────────────────────────────────────
    private async pollLoop() {
        while (true) {
            try {
                let hasMore = true;
                while (hasMore) {
                    hasMore = await this.pollOnce();
                }
            } catch (err: any) {
                this.logger.error(`Poll error: ${err?.message || err}`);
            }
            // Sleep between batches
            await this.sleep(this.pollIntervalMs);
        }
    }

    /**
     * Fetches one batch of events from the VPS.
     * Returns true if hasMore=true (backlog), false otherwise.
     */
    private async pollOnce(): Promise<boolean> {
        const state = await this.getOrCreateState();
        const url = `${this.apiBase}/v1/events?cursor=${state.cursor}&limit=${this.pollLimit}`;

        const res = await fetch(url, {
            headers: { 'X-API-Key': this.apiKey },
        });

        if (!res.ok) {
            throw new Error(`VPS responded ${res.status} ${res.statusText}`);
        }

        const body: PollResponse = await res.json();
        if (!body.ok) throw new Error(`VPS error: ${JSON.stringify(body)}`);

        const { items, nextCursor, hasMore } = body;

        if (items.length > 0) {
            await this.ingestBatch(items);
            this.logger.debug(`Pulled ${items.length} events. nextCursor=${nextCursor} hasMore=${hasMore}`);
        }

        // Always update cursor and lastPollAt
        state.cursor = nextCursor;
        state.lastPollAt = new Date().toISOString();
        if (items.length > 0) {
            state.totalIngested += items.length;
            const last = items[items.length - 1];
            if (last.dateTime) state.lastEventDateTime = last.dateTime;
        }
        await this.stateRepo.save(state);

        return hasMore;
    }

    // ── Batch ingestion ─────────────────────────────────────────────────────
    private async ingestBatch(items: HikEvent[]) {
        for (const ev of items) {
            await this.ingestOne(ev);
        }
    }

    private async ingestOne(ev: HikEvent) {
        // Skip denied access events
        if (ev.isDenied) return;

        // Skip if no employeeKey
        if (!ev.employeeKey) return;

        // Deduplicate by serialNo — check if we already stored this event
        if (ev.serialNo != null) {
            const existing = await this.eventsRepo.findOne({
                where: { serialNo: ev.serialNo },
            });
            if (existing) return; // Already seen
        }

        // Resolve employee
        const employee = await this.employeesService.findByEmployeeKey(ev.employeeKey);
        if (!employee) {
            // Unknown badge / employee not in system yet — log but don't crash
            this.logger.warn(`employeeKey "${ev.employeeKey}" (${ev.name}) not found in DB — skipping.`);
            return;
        }

        // Parse timestamp — prefer deviceMs for accuracy
        const timestamp = ev.deviceMs
            ? new Date(ev.deviceMs)
            : new Date(ev.dateTime);

        if (isNaN(timestamp.getTime())) {
            this.logger.warn(`Invalid timestamp for event serialNo=${ev.serialNo}, skipping.`);
            return;
        }

        const event = this.eventsRepo.create({
            employee,
            timestamp,
            deviceId: ev.deviceIp || ev.macAddress || 'hikvision',
            type: EventType.UNKNOWN, // IN/OUT resolved later by AttendanceProcessorService
            serialNo: ev.serialNo,
            eventCode: ev.sub,
            rawData: ev,
            isProcessed: false,
        });

        await this.eventsRepo.save(event);
        this.logger.verbose(
            `Saved event: emp="${ev.employeeKey}" name="${ev.name}" ts="${timestamp.toISOString()}" serialNo=${ev.serialNo}`,
        );
    }

    // ── Helpers ─────────────────────────────────────────────────────────────
    private async getOrCreateState(): Promise<HikvisionSyncState> {
        let state = await this.stateRepo.findOne({ where: { key: 'default' } });
        if (!state) {
            state = this.stateRepo.create({ key: 'default', cursor: 0, totalIngested: 0 });
            await this.stateRepo.save(state);
        }
        return state;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
