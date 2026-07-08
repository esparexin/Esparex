import { describe, it, expect } from 'vitest';
import { mapErrorToMessage } from '@/lib/mapErrorToMessage';

describe('mapErrorToMessage', () => {
    it('returns fallback for null/undefined', () => {
        expect(mapErrorToMessage(null, 'fallback')).toBe('fallback');
        expect(mapErrorToMessage(undefined, 'fallback')).toBe('fallback');
    });

    it('returns trimmed string for string errors', () => {
        expect(mapErrorToMessage('  something went wrong  ', 'fallback')).toBe('something went wrong');
    });

    it('returns fallback for empty string', () => {
        expect(mapErrorToMessage('   ', 'fallback')).toBe('fallback');
    });

    it('returns userMessage from error object', () => {
        expect(mapErrorToMessage({ userMessage: 'User error' }, 'fallback')).toBe('User error');
    });

    it('returns error from response.data.error envelope', () => {
        const error = { response: { data: { error: 'Server error' } } };
        expect(mapErrorToMessage(error, 'fallback')).toBe('Server error');
    });

    it('returns message from response.data.message envelope', () => {
        const error = { response: { data: { message: 'Not found' } } };
        expect(mapErrorToMessage(error, 'fallback')).toBe('Not found');
    });

    it('prefers userMessage over response envelope', () => {
        const error = {
            userMessage: 'Custom error',
            response: { data: { error: 'Server error' } },
        };
        expect(mapErrorToMessage(error, 'fallback')).toBe('Custom error');
    });

    it('prefers response.data.error over response.data.message', () => {
        const error = {
            response: { data: { error: 'Error text', message: 'Message text' } },
        };
        expect(mapErrorToMessage(error, 'fallback')).toBe('Error text');
    });

    it('filters transport noise from Error.message', () => {
        expect(mapErrorToMessage({ message: 'Request failed with status code 500' }, 'fallback')).toBe('fallback');
        expect(mapErrorToMessage({ message: 'Network error' }, 'fallback')).toBe('fallback');
        expect(mapErrorToMessage({ message: 'Timeout of 10000ms exceeded' }, 'fallback')).toBe('fallback');
    });

    it('returns non-noise Error.message', () => {
        expect(mapErrorToMessage({ message: 'Something specific' }, 'fallback')).toBe('Something specific');
    });

    it('returns fallback for non-object types', () => {
        expect(mapErrorToMessage(42, 'fallback')).toBe('fallback');
        expect(mapErrorToMessage(true, 'fallback')).toBe('fallback');
    });

    it('returns fallback for objects without recognized fields', () => {
        expect(mapErrorToMessage({ random: 'data' }, 'fallback')).toBe('fallback');
    });
});
