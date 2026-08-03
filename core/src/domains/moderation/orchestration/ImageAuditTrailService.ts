/**
 * Image Audit Trail Service (PR 5)
 *
 * Persists versioned moderation history records for security audit trails,
 * user appeals, and provider accuracy tracking.
 */
import { ModerationResultDTO } from '@esparex/contracts';

export interface AuditTrailRecord {
    id: string;
    imageId: string;
    entityId: string;
    entityType: 'ad' | 'service' | 'spare_part' | 'profile_photo' | 'document';
    result: ModerationResultDTO;
    modelVersion: string;
    policyVersion: string;
    providerVersion: string;
    timestamp: number;
}

export class ImageAuditTrailService {
    private inMemoryLog: AuditTrailRecord[] = [];

    async recordAudit(record: Omit<AuditTrailRecord, 'id'>): Promise<AuditTrailRecord> {
        const fullRecord: AuditTrailRecord = {
            id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            ...record,
        };
        this.inMemoryLog.push(fullRecord);
        return fullRecord;
    }

    async getAuditHistory(imageId: string): Promise<AuditTrailRecord[]> {
        return this.inMemoryLog.filter((r) => r.imageId === imageId);
    }
}
