import { describe, it, expect } from 'vitest';
import { AdminApiError } from '@/lib/api/adminClient';

describe('AdminApiError.resolveMessage', () => {
    it('resolves SSOT nested error object message', () => {
        const error = new AdminApiError('outer', 400, {
            success: false,
            error: { message: 'Nested error detail', code: 'VALIDATION_ERROR' },
        } as any);
        expect(AdminApiError.resolveMessage(error, 'fallback')).toBe('Nested error detail');
    });

    it('resolves details array validation messages', () => {
        const error = new AdminApiError('outer', 400, {
            success: false,
            error: { message: 'outer' },
            details: [{ message: 'Field is required' }, { message: 'Too long' }],
        } as any);
        expect(AdminApiError.resolveMessage(error, 'fallback')).toBe('outer');
    });

    it('falls back to payload.message', () => {
        const error = new AdminApiError('outer', 400, {
            success: false,
            error: 'simple error',
            message: 'Payload message',
        });
        expect(AdminApiError.resolveMessage(error, 'fallback')).toBe('Payload message');
    });

    it('falls back to payload.error string', () => {
        const error = new AdminApiError('outer', 400, {
            success: false,
            error: 'Error string',
        });
        expect(AdminApiError.resolveMessage(error, 'fallback')).toBe('Error string');
    });

    it('falls back to Error.message', () => {
        const error = new AdminApiError('Error message', 400, {
            success: false,
        });
        expect(AdminApiError.resolveMessage(error, 'fallback')).toBe('Error message');
    });

    it('falls back to provided fallback string', () => {
        const error = new AdminApiError('', 400, { success: false });
        expect(AdminApiError.resolveMessage(error, 'fallback')).toBe('fallback');
    });

    it('returns non-AdminApiError error.message', () => {
        expect(AdminApiError.resolveMessage(new Error('Something broke'), 'fallback')).toBe('Something broke');
    });

    it('returns string error directly', () => {
        expect(AdminApiError.resolveMessage('Direct error', 'fallback')).toBe('Direct error');
    });

    it('returns fallback for unknown error types', () => {
        expect(AdminApiError.resolveMessage(42, 'fallback')).toBe('fallback');
    });
});
