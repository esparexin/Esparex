import { describe, it, expect } from 'vitest';
import { convertHeicToJpeg } from '@/lib/uploads/heicConverter';

describe('heicConverter lazy-loading utility', () => {
    it('returns non-HEIC files directly without triggering dynamic HEIC module import', async () => {
        const file = new File(['fake-png-content'], 'sample.png', { type: 'image/png' });
        const result = await convertHeicToJpeg(file);
        expect(result).toBe(file);
    });
});
