import { LISTING_TYPE } from '../../../../shared/enums/listingType';
import {
    getListingTypeCapability,
    getListingTypeRemediation,
    inferListingType,
} from '../../utils/listingTypeIntegrity';

describe('listingTypeIntegrity', () => {
    it('treats business-style resale content without service fields as ad', () => {
        const inferred = inferListingType(
            {},
            ['postad', 'postservice']
        );

        expect(inferred.listingType).toBe(LISTING_TYPE.AD);
        expect(inferred.confidence).toBe('medium');
        expect(inferred.reason).toBe('generic_listing_without_service_or_spare_signals');
    });

    it('infers service only from service-specific fields', () => {
        const inferred = inferListingType({
            serviceTypeIds: ['svc-1'],
            onsiteService: true,
        });

        expect(inferred.listingType).toBe(LISTING_TYPE.SERVICE);
        expect(inferred.confidence).toBe('high');
        expect(inferred.serviceSignals).toEqual(expect.arrayContaining(['serviceTypeIds', 'onsiteService']));
    });

    it('infers spare parts from spare-specific fields', () => {
        const inferred = inferListingType({
            sparePartId: 'part-1',
            stock: 3,
        });

        expect(inferred.listingType).toBe(LISTING_TYPE.SPARE_PART);
        expect(inferred.confidence).toBe('high');
        expect(inferred.sparePartSignals).toEqual(expect.arrayContaining(['sparePartId', 'stock']));
    });

    it('does not remediate a service listing when only category capability implies service', () => {
        const decision = getListingTypeRemediation(
            LISTING_TYPE.SERVICE,
            {},
            ['postservice']
        );

        expect(decision).toBeNull();
    });

    it('remediates misclassified service listings back to ad when no service signals exist', () => {
        const decision = getListingTypeRemediation(
            LISTING_TYPE.SERVICE,
            {},
            ['postad', 'postservice']
        );

        expect(decision).toEqual({
            from: LISTING_TYPE.SERVICE,
            to: LISTING_TYPE.AD,
            confidence: 'medium',
            reason: 'generic_listing_without_service_or_spare_signals',
        });
    });

    it('maps category listingType arrays into capability flags', () => {
        expect(getListingTypeCapability(['postad', 'postsparepart'])).toEqual({
            supportsAd: true,
            supportsService: false,
            supportsSparePart: true,
        });
    });
});
