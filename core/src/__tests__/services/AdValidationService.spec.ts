import { buildDuplicateFingerprint } from '../../services/AdValidationService';

describe('buildDuplicateFingerprint', () => {
    it('builds deterministic fingerprints from normalized payload fields', () => {
        const payloadA = {
            categoryId: '  CATEGORY-01  ',
            brandId: 'Brand!!',
            modelId: 'Model #1',
            price: 1499,
            location: {
                city: ' Macherla!! ',
                state: 'Andhra-Pradesh',
                coordinates: {
                    coordinates: [79.43533, 16.47635] as [number, number],
                },
            },
        };

        const payloadB = {
            categoryId: 'category01',
            brandId: 'brand',
            modelId: 'model 1',
            devicePowerOn: true,
            price: '1499',
            location: {
                city: 'macherla',
                state: 'andhra pradesh',
                coordinates: {
                    coordinates: [79.4353, 16.4763] as [number, number],
                },
            },
        };

        const fp1 = buildDuplicateFingerprint(payloadA, ' Seller-001 ');
        const fp2 = buildDuplicateFingerprint(payloadB, 'seller001');

        expect(fp1).toBeDefined();
        expect(fp1).toBe(fp2);
    });

    it('returns undefined when required duplicate dimensions are missing', () => {
        const payloadMissingCoreFields = {
            categoryId: undefined,
            price: undefined,
            location: {},
        };

        const fp = buildDuplicateFingerprint(payloadMissingCoreFields, 'seller001');
        expect(fp).toBeUndefined();
    });
});
