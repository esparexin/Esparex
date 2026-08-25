import { LocalOcrProvider } from '../../../domains/moderation/classifiers/LocalOcrProvider';

describe('LocalOcrProvider (PR 6 — Stage 3 Intelligence)', () => {
    let ocrProvider: LocalOcrProvider;

    beforeEach(() => {
        ocrProvider = new LocalOcrProvider();
    });

    it('returns passed: true when no contact details exist', async () => {
        const text = 'Genuine Hyundai i20 headlight assembly in excellent condition';
        const result = ocrProvider.extractContactsFromText(text);

        expect(result.hasProhibitedContact).toBe(false);
        expect(result.detectedContacts).toHaveLength(0);

        const stage3Result = await ocrProvider.process(Buffer.from(text));
        expect(stage3Result.passed).toBe(true);
    });

    it('detects 10-digit Indian phone numbers', async () => {
        const text = 'Call me directly for fast deal: 9876543210';
        const result = ocrProvider.extractContactsFromText(text);

        expect(result.hasProhibitedContact).toBe(true);
        expect(result.detectedContacts).toEqual([
            { type: 'PHONE', match: '9876543210' },
        ]);

        const stage3Result = await ocrProvider.process(Buffer.from(text));
        expect(stage3Result.passed).toBe(false);
        expect(stage3Result.reason).toBe('PROHIBITED_CONTACT_TEXT_FOUND');
    });

    it('detects external URLs and domain names', async () => {
        const text = 'Buy directly at our store external-spares-shop.com for 20% discount!';
        const result = ocrProvider.extractContactsFromText(text);

        expect(result.hasProhibitedContact).toBe(true);
        expect(result.detectedContacts).toContainEqual({
            type: 'URL',
            match: 'external-spares-shop.com',
        });
    });

    it('detects email addresses', async () => {
        const text = 'Send inquiry to seller.contact@gmail.com for pricing';
        const result = ocrProvider.extractContactsFromText(text);

        expect(result.hasProhibitedContact).toBe(true);
        expect(result.detectedContacts).toEqual([
            { type: 'EMAIL', match: 'seller.contact@gmail.com' },
        ]);
    });

    it('detects WhatsApp and Telegram social handles', async () => {
        const text = 'WhatsApp me at wa.me/919876543210 for quick order';
        const result = ocrProvider.extractContactsFromText(text);

        expect(result.hasProhibitedContact).toBe(true);
        expect(result.detectedContacts).toContainEqual({
            type: 'HANDLE',
            match: 'wa.me/919876543210',
        });
    });

    it('detects UPI payment handles', async () => {
        const text = 'Pay directly via UPI: seller@okaxis';
        const result = ocrProvider.extractContactsFromText(text);

        expect(result.hasProhibitedContact).toBe(true);
        expect(result.detectedContacts).toEqual([
            { type: 'UPI', match: 'seller@okaxis' },
        ]);
    });

    it('is immune to ReDoS catastrophic backtracking on adversarial input strings', () => {
        // Adversarial string with repeating hyphens and subdomains designed to trigger backtracking in unanchored regexes
        const adversarialString = 'http://' + 'a-'.repeat(2500) + 'xyz';
        const startTime = Date.now();
        const result = ocrProvider.extractContactsFromText(adversarialString);
        const durationMs = Date.now() - startTime;

        expect(durationMs).toBeLessThan(100); // Must complete quickly without event loop hang
        expect(result).toBeDefined();
    });
});
