import { describe, it, expect } from 'vitest';
import { parseAdminResponse } from '@/lib/api/parseAdminResponse';

describe('parseAdminResponse', () => {
    it('extracts items from data.items', () => {
        const payload = { data: { items: [{ id: 1 }, { id: 2 }] } };
        const result = parseAdminResponse(payload);
        expect(result.items).toHaveLength(2);
    });

    it('extracts items from data.data', () => {
        const payload = { data: { data: [{ id: 1 }] } };
        const result = parseAdminResponse(payload);
        expect(result.items).toHaveLength(1);
    });

    it('extracts items from data.messages', () => {
        const payload = { data: { messages: [{ id: 1 }] } };
        const result = parseAdminResponse(payload);
        expect(result.items).toHaveLength(1);
    });

    it('extracts items from root data array', () => {
        const payload = { data: [{ id: 1 }, { id: 2 }] };
        const result = parseAdminResponse(payload);
        expect(result.items).toHaveLength(2);
    });

    it('extracts items from root items array', () => {
        const payload = { items: [{ id: 1 }] };
        const result = parseAdminResponse(payload);
        expect(result.items).toHaveLength(1);
    });

    it('extracts items from root data.items', () => {
        const payload = { data: [{ id: 1 }] };
        const result = parseAdminResponse(payload);
        expect(result.items).toHaveLength(1);
    });

    it('returns empty array for unknown payload shape', () => {
        const result = parseAdminResponse({ unknown: true });
        expect(result.items).toEqual([]);
    });

    it('returns empty array for non-object payload', () => {
        expect(parseAdminResponse(null).items).toEqual([]);
        expect(parseAdminResponse(undefined).items).toEqual([]);
        expect(parseAdminResponse('string').items).toEqual([]);
    });

    it('extracts pagination from meta.pagination', () => {
        const payload = { meta: { pagination: { page: 1, limit: 20, total: 100 } } };
        const result = parseAdminResponse(payload);
        expect(result.pagination).toEqual({ page: 1, limit: 20, total: 100 });
    });

    it('uses pages as fallback for totalPages', () => {
        const payload = { meta: { pagination: { pages: 5 } } };
        const result = parseAdminResponse(payload);
        expect(result.pagination?.totalPages).toBe(5);
    });

    it('returns null pagination when absent', () => {
        const payload = { data: { items: [{ id: 1 }] } };
        const result = parseAdminResponse(payload);
        expect(result.pagination).toBeNull();
    });

    it('extracts meta from root meta', () => {
        const payload = { meta: { requestId: 'abc' }, data: { items: [] } };
        const result = parseAdminResponse(payload);
        expect(result.meta).toEqual({ requestId: 'abc' });
    });

    it('infers meta from leftover data fields', () => {
        const payload = { data: { items: [], extraField: 'value' } };
        const result = parseAdminResponse(payload);
        expect(result.meta).toEqual({ extraField: 'value' });
    });
});
