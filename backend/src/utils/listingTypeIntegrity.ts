import { FORM_PLACEMENT, LISTING_TYPE, type ListingTypeValue } from '../../../shared/enums/listingType';

type CategoryCapabilityInput = string[] | null | undefined;

export type ListingTypeCapability = {
    supportsAd: boolean;
    supportsService: boolean;
    supportsSparePart: boolean;
};

export type ListingTypeIntegrityInput = {
    sparePartId?: unknown;
    sparePartIds?: unknown;
    compatibleModels?: unknown;
    stock?: unknown;
    serviceTypeIds?: unknown;
    priceMin?: unknown;
    priceMax?: unknown;
    diagnosticFee?: unknown;
    onsiteService?: unknown;
    turnaroundTime?: unknown;
    included?: unknown;
    excluded?: unknown;
};

export type ListingTypeInferenceConfidence = 'high' | 'medium' | 'low' | 'conflict';

export type ListingTypeInferenceResult = {
    listingType: ListingTypeValue;
    confidence: ListingTypeInferenceConfidence;
    reason: string;
    serviceSignals: string[];
    sparePartSignals: string[];
    capability: ListingTypeCapability;
};

export type ListingTypeRemediationDecision = {
    from: ListingTypeValue;
    to: ListingTypeValue;
    confidence: Exclude<ListingTypeInferenceConfidence, 'conflict' | 'low'>;
    reason: string;
};

const hasFiniteNumber = (value: unknown): boolean =>
    typeof value === 'number' && Number.isFinite(value);

const hasNonEmptyString = (value: unknown): boolean =>
    typeof value === 'string' && value.trim().length > 0;

const hasNonEmptyArray = (value: unknown): boolean =>
    Array.isArray(value) && value.length > 0;

export const getListingTypeCapability = (listingType: CategoryCapabilityInput): ListingTypeCapability => {
    const values = Array.isArray(listingType)
        ? listingType.filter((value): value is string => typeof value === 'string')
        : [];

    return {
        supportsAd: values.includes(FORM_PLACEMENT.AD),
        supportsService: values.includes(FORM_PLACEMENT.SERVICE),
        supportsSparePart: values.includes(FORM_PLACEMENT.SPARE_PART),
    };
};

const collectServiceSignals = (input: ListingTypeIntegrityInput): string[] => {
    const signals: string[] = [];

    if (hasNonEmptyArray(input.serviceTypeIds)) signals.push('serviceTypeIds');
    if (hasFiniteNumber(input.priceMin)) signals.push('priceMin');
    if (hasFiniteNumber(input.priceMax)) signals.push('priceMax');
    if (hasFiniteNumber(input.diagnosticFee)) signals.push('diagnosticFee');
    if (typeof input.onsiteService === 'boolean') signals.push('onsiteService');
    if (hasNonEmptyString(input.turnaroundTime)) signals.push('turnaroundTime');
    if (hasNonEmptyString(input.included)) signals.push('included');
    if (hasNonEmptyString(input.excluded)) signals.push('excluded');

    return signals;
};

const collectSparePartSignals = (input: ListingTypeIntegrityInput): string[] => {
    const signals: string[] = [];

    if (input.sparePartId) signals.push('sparePartId');
    if (hasNonEmptyArray(input.sparePartIds)) signals.push('sparePartIds');
    if (hasNonEmptyArray(input.compatibleModels)) signals.push('compatibleModels');
    if (hasFiniteNumber(input.stock)) signals.push('stock');

    return signals;
};

export const inferListingType = (
    input: ListingTypeIntegrityInput,
    categoryCapabilityInput?: CategoryCapabilityInput
): ListingTypeInferenceResult => {
    const capability = getListingTypeCapability(categoryCapabilityInput);
    const serviceSignals = collectServiceSignals(input);
    const sparePartSignals = collectSparePartSignals(input);
    const hasServiceSignals = serviceSignals.length > 0;
    const hasSparePartSignals = sparePartSignals.length > 0;

    if (hasServiceSignals && hasSparePartSignals) {
        return {
            listingType: LISTING_TYPE.AD,
            confidence: 'conflict',
            reason: `conflicting_signals:${[...serviceSignals, ...sparePartSignals].join(',')}`,
            serviceSignals,
            sparePartSignals,
            capability,
        };
    }

    if (hasSparePartSignals) {
        return {
            listingType: LISTING_TYPE.SPARE_PART,
            confidence: 'high',
            reason: `spare_part_signals:${sparePartSignals.join(',')}`,
            serviceSignals,
            sparePartSignals,
            capability,
        };
    }

    if (hasServiceSignals) {
        return {
            listingType: LISTING_TYPE.SERVICE,
            confidence: 'high',
            reason: `service_signals:${serviceSignals.join(',')}`,
            serviceSignals,
            sparePartSignals,
            capability,
        };
    }

    if (capability.supportsAd && !capability.supportsService && !capability.supportsSparePart) {
        return {
            listingType: LISTING_TYPE.AD,
            confidence: 'high',
            reason: 'category_supports_only_ad',
            serviceSignals,
            sparePartSignals,
            capability,
        };
    }

    if (capability.supportsService && !capability.supportsAd && !capability.supportsSparePart) {
        return {
            listingType: LISTING_TYPE.SERVICE,
            confidence: 'low',
            reason: 'category_supports_only_service_without_service_signals',
            serviceSignals,
            sparePartSignals,
            capability,
        };
    }

    if (capability.supportsSparePart && !capability.supportsAd && !capability.supportsService) {
        return {
            listingType: LISTING_TYPE.SPARE_PART,
            confidence: 'low',
            reason: 'category_supports_only_spare_part_without_spare_signals',
            serviceSignals,
            sparePartSignals,
            capability,
        };
    }

    return {
        listingType: LISTING_TYPE.AD,
        confidence: capability.supportsAd ? 'medium' : 'high',
        reason: capability.supportsAd
            ? 'generic_listing_without_service_or_spare_signals'
            : 'default_fallback_ad',
        serviceSignals,
        sparePartSignals,
        capability,
    };
};

export const getListingTypeRemediation = (
    currentType: ListingTypeValue,
    input: ListingTypeIntegrityInput,
    categoryCapabilityInput?: CategoryCapabilityInput
): ListingTypeRemediationDecision | null => {
    const inferred = inferListingType(input, categoryCapabilityInput);

    if (inferred.confidence === 'conflict' || inferred.confidence === 'low') {
        return null;
    }

    if (inferred.listingType === currentType) {
        return null;
    }

    return {
        from: currentType,
        to: inferred.listingType,
        confidence: inferred.confidence,
        reason: inferred.reason,
    };
};
