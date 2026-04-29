import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSmartAlert, deleteSmartAlert, fetchSmartAlerts } from "@/lib/api/user/smartAlerts";
import { removeSavedSearch } from "@/lib/api/user/savedSearches";
import { apiClient } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
    },
}));

describe('SmartAlerts API Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── createSmartAlert ───────────────────────────────────────────────────────

    describe('createSmartAlert', () => {
        it('returns normalized SmartAlert on success', async () => {
            vi.mocked(apiClient.post).mockResolvedValueOnce({
                success: true,
                data: { _id: 'alert-001', name: 'SUV near me', isActive: true },
            });

            const result = await createSmartAlert({
                name: 'SUV near me',
                criteria: { keywords: 'SUV' },
                frequency: 'instant',
                notificationChannels: ['email'],
            });

            expect(result).not.toBeNull();
            expect(result?.id).toBe('alert-001');
            expect(result?.name).toBe('SUV near me');
        });

        it('returns null when API response has no id', async () => {
            vi.mocked(apiClient.post).mockResolvedValueOnce({
                success: true,
                data: { name: 'No ID alert' }, // missing _id / id
            });

            const result = await createSmartAlert({
                name: 'No ID alert',
                criteria: {},
                frequency: 'instant',
                notificationChannels: [],
            });

            expect(result).toBeNull();
        });

        it('returns null when response shape is empty', async () => {
            vi.mocked(apiClient.post).mockResolvedValueOnce(null);

            const result = await createSmartAlert({
                name: 'Empty response',
                criteria: {},
                frequency: 'instant',
                notificationChannels: [],
            });

            expect(result).toBeNull();
        });

        it('propagates API errors', async () => {
            vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network error'));

            await expect(
                createSmartAlert({ name: 'fail', criteria: {}, frequency: 'instant', notificationChannels: [] })
            ).rejects.toThrow('Network error');
        });
    });

    // ── deleteSmartAlert ───────────────────────────────────────────────────────

    describe('deleteSmartAlert', () => {
        it('resolves without throwing on success', async () => {
            vi.mocked(apiClient.delete).mockResolvedValueOnce({ success: true, data: null });

            await expect(deleteSmartAlert('alert-001')).resolves.toBeUndefined();
        });

        it('propagates API errors', async () => {
            vi.mocked(apiClient.delete).mockRejectedValueOnce(new Error('Not found'));

            await expect(deleteSmartAlert('alert-missing')).rejects.toThrow('Not found');
        });
    });

    // ── removeSavedSearch ──────────────────────────────────────────────────────

    describe('removeSavedSearch', () => {
        it('resolves without throwing on success', async () => {
            vi.mocked(apiClient.delete).mockResolvedValueOnce({ success: true, data: null });

            await expect(removeSavedSearch('search-001')).resolves.toBeUndefined();
        });

        it('propagates API errors', async () => {
            vi.mocked(apiClient.delete).mockRejectedValueOnce(new Error('Unauthorized'));

            await expect(removeSavedSearch('search-001')).rejects.toThrow('Unauthorized');
        });
    });

    // ── fetchSmartAlerts ───────────────────────────────────────────────────────

    describe('fetchSmartAlerts', () => {
        it('returns normalized list from wrapped data shape', async () => {
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                success: true,
                data: [
                    { _id: 'a1', name: 'Alert 1', isActive: true },
                    { _id: 'a2', name: 'Alert 2', isActive: false },
                ],
            });

            const alerts = await fetchSmartAlerts();
            expect(alerts).toHaveLength(2);
            expect(alerts[0]?.id).toBe('a1');
            expect(alerts[1]?.id).toBe('a2');
        });

        it('returns empty array when response is empty', async () => {
            vi.mocked(apiClient.get).mockResolvedValueOnce(null);

            const alerts = await fetchSmartAlerts();
            expect(alerts).toEqual([]);
        });
    });
});
