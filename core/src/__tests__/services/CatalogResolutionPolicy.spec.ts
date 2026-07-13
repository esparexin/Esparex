import { CatalogResolutionPolicy, CatalogResolutionDecision } from '../../services/catalog/CatalogResolutionPolicy';
import { CatalogValidationService } from '../../services/catalog/CatalogValidationService';

describe('CatalogResolutionPolicy & CatalogValidationService Pipeline', () => {
    describe('validateCatalogInput (Pipeline)', () => {
        it('accepts clean, valid brand and model names', () => {
            expect(CatalogValidationService.validateCatalogInput({ name: 'Apple', requestType: 'brand' }).ok).toBe(true);
            expect(CatalogValidationService.validateCatalogInput({ name: 'Galaxy S24 FE', requestType: 'model' }).ok).toBe(true);
            expect(CatalogValidationService.validateCatalogInput({ name: 'iPhone 16 Pro', requestType: 'model' }).ok).toBe(true);
        });

        it('rejects names that are too short', () => {
            const res = CatalogValidationService.validateCatalogInput({ name: 'A', requestType: 'brand' });
            expect(res.ok).toBe(false);
            expect(res.reason).toContain('at least 2 characters');
        });

        it('rejects keyboard mashing or repetitive characters', () => {
            const mashingRes = CatalogValidationService.validateCatalogInput({ name: 'asdfasdf', requestType: 'model' });
            expect(mashingRes.ok).toBe(false);
            expect(mashingRes.reason).toContain('Keyboard mashing');

            const repetitionRes = CatalogValidationService.validateCatalogInput({ name: 'aaaaaaa', requestType: 'brand' });
            expect(repetitionRes.ok).toBe(false);
            expect(repetitionRes.reason).toContain('Keyboard mashing');
        });

        it('rejects pure symbols or repetitive punctuation', () => {
            const dotsRes = CatalogValidationService.validateCatalogInput({ name: '.......', requestType: 'brand' });
            expect(dotsRes.ok).toBe(false);
            expect(dotsRes.reason).toContain('only of special characters');

            const symbolsRes = CatalogValidationService.validateCatalogInput({ name: '$$$$$$$$', requestType: 'model' });
            expect(symbolsRes.ok).toBe(false);
            expect(symbolsRes.reason).toContain('only of special characters');
        });

        it('rejects long sequences of numbers only', () => {
            const numbersRes = CatalogValidationService.validateCatalogInput({ name: '123456789', requestType: 'model' });
            expect(numbersRes.ok).toBe(false);
            expect(numbersRes.reason).toContain('sequences of numbers');
        });

        it('rejects reserved system words', () => {
            const systemRes = CatalogValidationService.validateCatalogInput({ name: 'admin', requestType: 'brand' });
            expect(systemRes.ok).toBe(false);
            expect(systemRes.reason).toContain('reserved system word');
        });
    });

    describe('CatalogResolutionPolicy evaluate', () => {
        it('returns AUTO_APPROVE for valid inputs', () => {
            const decision = CatalogResolutionPolicy.evaluate({
                requestType: 'brand',
                categoryId: '65fa29c9d2c1f2e165fa29c9',
                requestedName: 'Lava',
                userId: '65fa29c9d2c1f2e165fa29ca'
            });
            expect(decision).toBe(CatalogResolutionDecision.AUTO_APPROVE);
        });

        it('returns REJECT for spam/garbage validation failures', () => {
            const decision = CatalogResolutionPolicy.evaluate({
                requestType: 'model',
                categoryId: '65fa29c9d2c1f2e165fa29c9',
                requestedName: '.......',
                userId: '65fa29c9d2c1f2e165fa29ca'
            });
            expect(decision).toBe(CatalogResolutionDecision.REJECT);
        });
    });
});
