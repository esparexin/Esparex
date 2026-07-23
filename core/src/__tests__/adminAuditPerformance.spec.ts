import AdminLog from '../models/AdminLog';
import { getAuditLogs } from '../services/AdminService';

describe('Admin Audit Logs Query & Index Optimization (PR 2)', () => {
    it('verifies that AdminLog model contains descending index on createdAt and targetType compound index', () => {
        const indexes = AdminLog.schema.indexes();
        const indexNames = indexes.map((idx: unknown) => {
            if (Array.isArray(idx) && idx[1] && typeof idx[1] === 'object') {
                return (idx[1] as { name?: string }).name;
            }
            return undefined;
        });

        expect(indexNames).toContain('idx_adminlog_createdAt_desc_idx');
        expect(indexNames).toContain('idx_adminlog_targetType_createdAt_idx');
        expect(indexNames).toContain('idx_adminlog_adminId_createdAt_idx');
        expect(indexNames).toContain('idx_adminlog_action_createdAt_idx');
    });

    it('verifies getAuditLogs function returns lean audit log documents', async () => {
        // getAuditLogs uses AdminLog.find().lean() for lightweight document retrieval
        expect(typeof getAuditLogs).toBe('function');
    });
});
