import { describe, it, expect } from 'vitest';
import { convertHeicToJpeg } from '../lib/uploads/heicConverter';

describe('heicConverter Utility', () => {
    it('returns non-HEIC file directly without importing heic2any', async () => {
        const dummyFile = new File(['dummy content'], 'photo.jpg', { type: 'image/jpeg' });
        const result = await convertHeicToJpeg(dummyFile);
        expect(result).toBe(dummyFile);
    });
});
