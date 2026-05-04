"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getListingTypeRemediation = exports.inferListingType = exports.getListingTypeCapability = void 0;
const listingType_1 = require("@core/constants/enums/listingType");
const hasFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const hasNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const hasNonEmptyArray = (value) => Array.isArray(value) && value.length > 0;
const getListingTypeCapability = (listingType) => {
    const values = Array.isArray(listingType)
        ? listingType.filter((value) => typeof value === 'string')
        : [];
    return {
        supportsAd: values.includes(listingType_1.LISTING_TYPE.AD),
        supportsService: values.includes(listingType_1.LISTING_TYPE.SERVICE),
        supportsSparePart: values.includes(listingType_1.LISTING_TYPE.SPARE_PART),
    };
};
exports.getListingTypeCapability = getListingTypeCapability;
const collectServiceSignals = (input) => {
    const signals = [];
    if (hasNonEmptyArray(input.serviceTypeIds))
        signals.push('serviceTypeIds');
    if (hasFiniteNumber(input.priceMin))
        signals.push('priceMin');
    if (hasFiniteNumber(input.priceMax))
        signals.push('priceMax');
    if (hasFiniteNumber(input.diagnosticFee))
        signals.push('diagnosticFee');
    if (typeof input.onsiteService === 'boolean')
        signals.push('onsiteService');
    if (hasNonEmptyString(input.turnaroundTime))
        signals.push('turnaroundTime');
    if (hasNonEmptyString(input.included))
        signals.push('included');
    if (hasNonEmptyString(input.excluded))
        signals.push('excluded');
    return signals;
};
const collectSparePartSignals = (input) => {
    const signals = [];
    if (input.sparePartId)
        signals.push('sparePartId');
    if (hasNonEmptyArray(input.sparePartIds))
        signals.push('sparePartIds');
    if (hasFiniteNumber(input.stock))
        signals.push('stock');
    return signals;
};
const inferListingType = (input, categoryCapabilityInput) => {
    const capability = (0, exports.getListingTypeCapability)(categoryCapabilityInput);
    const serviceSignals = collectServiceSignals(input);
    const sparePartSignals = collectSparePartSignals(input);
    const hasServiceSignals = serviceSignals.length > 0;
    const hasSparePartSignals = sparePartSignals.length > 0;
    if (hasServiceSignals && hasSparePartSignals) {
        return {
            listingType: listingType_1.LISTING_TYPE.AD,
            confidence: 'conflict',
            reason: `conflicting_signals:${[...serviceSignals, ...sparePartSignals].join(',')}`,
            serviceSignals,
            sparePartSignals,
            capability,
        };
    }
    if (hasSparePartSignals) {
        return {
            listingType: listingType_1.LISTING_TYPE.SPARE_PART,
            confidence: 'high',
            reason: `spare_part_signals:${sparePartSignals.join(',')}`,
            serviceSignals,
            sparePartSignals,
            capability,
        };
    }
    if (hasServiceSignals) {
        return {
            listingType: listingType_1.LISTING_TYPE.SERVICE,
            confidence: 'high',
            reason: `service_signals:${serviceSignals.join(',')}`,
            serviceSignals,
            sparePartSignals,
            capability,
        };
    }
    if (capability.supportsAd && !capability.supportsService && !capability.supportsSparePart) {
        return {
            listingType: listingType_1.LISTING_TYPE.AD,
            confidence: 'high',
            reason: 'category_supports_only_ad',
            serviceSignals,
            sparePartSignals,
            capability,
        };
    }
    if (capability.supportsService && !capability.supportsAd && !capability.supportsSparePart) {
        return {
            listingType: listingType_1.LISTING_TYPE.SERVICE,
            confidence: 'low',
            reason: 'category_supports_only_service_without_service_signals',
            serviceSignals,
            sparePartSignals,
            capability,
        };
    }
    if (capability.supportsSparePart && !capability.supportsAd && !capability.supportsService) {
        return {
            listingType: listingType_1.LISTING_TYPE.SPARE_PART,
            confidence: 'low',
            reason: 'category_supports_only_spare_part_without_spare_signals',
            serviceSignals,
            sparePartSignals,
            capability,
        };
    }
    return {
        listingType: listingType_1.LISTING_TYPE.AD,
        confidence: capability.supportsAd ? 'medium' : 'high',
        reason: capability.supportsAd
            ? 'generic_listing_without_service_or_spare_signals'
            : 'default_fallback_ad',
        serviceSignals,
        sparePartSignals,
        capability,
    };
};
exports.inferListingType = inferListingType;
const getListingTypeRemediation = (currentType, input, categoryCapabilityInput) => {
    const inferred = (0, exports.inferListingType)(input, categoryCapabilityInput);
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
exports.getListingTypeRemediation = getListingTypeRemediation;
//# sourceMappingURL=listingTypeIntegrity.js.map