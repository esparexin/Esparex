import { OCRService } from '../../../domains/moderation/classifiers/OCRService';
import { DuplicateImageService } from '../../../domains/moderation/classifiers/DuplicateImageService';
import { SafetyClassifier } from '../../../domains/moderation/classifiers/SafetyClassifier';

describe('Image & Content Intelligence Classifiers (PR 4)', () => {
    it('OCRService detects phone numbers and URLs in raw text', () => {
        const ocr = new OCRService();
        const result = ocr.analyzeText('Call me at 9876543210 or visit https://scam.com for payment');

        expect(result.detectedPhones).toContain('9876543210');
        expect(result.detectedUrls).toContain('https://scam.com');
    });

    it('OCRService detects UPI handles in text', () => {
        const ocr = new OCRService();
        const result = ocr.analyzeText('Pay to seller@okaxis for quick delivery');

        expect(result.detectedQRCodes).toContain('seller@okaxis');
    });

    it('DuplicateImageService detects duplicate images via perceptual hash', () => {
        const service = new DuplicateImageService();
        const buf1 = Buffer.from('image-data-sample-1');
        const buf2 = Buffer.from('image-data-sample-1');
        const buf3 = Buffer.from('different-image-bytes-completely-12345');

        const fp1 = service.computeFingerprint(buf1);
        const fp2 = service.computeFingerprint(buf2);
        const fp3 = service.computeFingerprint(buf3);

        expect(service.isDuplicate(fp1, fp2)).toBe(true);
        expect(fp1.fileHash).toBe(fp2.fileHash);
    });

    it('SafetyClassifier extracts scores and signals', () => {
        const classifier = new SafetyClassifier();
        const mockResponse = {
            provider: 'TestProvider',
            latencyMs: 10,
            adultScore: 0.85,
            violenceScore: 0.10,
            racyScore: 0.40,
            goreScore: 0.05,
            labels: ['Test'],
            signals: [],
        };

        const result = classifier.classify(mockResponse);
        expect(result.adultScore).toBe(0.85);
        expect(result.signals).toHaveLength(1);
    });
});
