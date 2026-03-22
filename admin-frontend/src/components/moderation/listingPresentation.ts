import { LISTING_TYPE, type ListingTypeValue } from "@shared/enums/listingType";
import type { ModerationItem } from "./moderationTypes";

type ListingPresentation = {
    actionEntityLabel: string;
    actionEntityLabelPlural: string;
    pageTitle: string;
    tableDetailsHeader: string;
    attributeHeader: string;
    modalTitle: string;
    modalDescription: string;
    informationHeader: string;
};

type ListingAttribute = {
    label: string;
    value: string;
};

const formatMoney = (currency: string, amount: number): string =>
    `${currency} ${amount.toLocaleString()}`;

const startCase = (value: string): string =>
    value
        .split(/[_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

export const getListingPresentation = (listingType?: ListingTypeValue): ListingPresentation => {
    switch (listingType) {
        case LISTING_TYPE.SERVICE:
            return {
                actionEntityLabel: "service",
                actionEntityLabelPlural: "services",
                pageTitle: "Services",
                tableDetailsHeader: "Service Details",
                attributeHeader: "Service Mode",
                modalTitle: "Service Details",
                modalDescription: "Inspect and moderate service details",
                informationHeader: "Service Information",
            };
        case LISTING_TYPE.SPARE_PART:
            return {
                actionEntityLabel: "spare part listing",
                actionEntityLabelPlural: "spare part listings",
                pageTitle: "Spare Parts",
                tableDetailsHeader: "Part Details",
                attributeHeader: "Part Condition",
                modalTitle: "Part Details",
                modalDescription: "Inspect and moderate spare part details",
                informationHeader: "Spare Part Information",
            };
        case LISTING_TYPE.AD:
            return {
                actionEntityLabel: "listing",
                actionEntityLabelPlural: "listings",
                pageTitle: "Listings",
                tableDetailsHeader: "Ad Details",
                attributeHeader: "Condition",
                modalTitle: "Ad Details",
                modalDescription: "Inspect and moderate ad details",
                informationHeader: "Ad Information",
            };
        default:
            return {
                actionEntityLabel: "listing",
                actionEntityLabelPlural: "listings",
                pageTitle: "Listings",
                tableDetailsHeader: "Listing Details",
                attributeHeader: "Attribute",
                modalTitle: "Listing Details",
                modalDescription: "Inspect and moderate listing details",
                informationHeader: "Listing Information",
            };
    }
};

export const getListingPriceSummary = (item: ModerationItem): string => {
    if (item.listingType === LISTING_TYPE.SERVICE) {
        const min = item.priceMin;
        const max = item.priceMax;

        if (typeof min === "number" && typeof max === "number") {
            if (min === max) return formatMoney(item.currency, min);
            return `${formatMoney(item.currency, min)} - ${formatMoney(item.currency, max)}`;
        }
        if (typeof min === "number") return `From ${formatMoney(item.currency, min)}`;
        if (typeof max === "number") return `Up to ${formatMoney(item.currency, max)}`;
    }

    return formatMoney(item.currency, item.price);
};

export const getListingAttribute = (
    item: ModerationItem,
    listingType?: ListingTypeValue
): ListingAttribute => {
    const effectiveType = listingType || item.listingType;

    if (effectiveType === LISTING_TYPE.SERVICE) {
        if (item.onsiteService === true) {
            return { label: "Service Mode", value: "On-site" };
        }
        if (item.onsiteService === false) {
            return { label: "Service Mode", value: "In-store" };
        }
        return { label: "Service Mode", value: "Not specified" };
    }

    if (effectiveType === LISTING_TYPE.SPARE_PART) {
        if (item.condition) {
            return { label: "Part Condition", value: startCase(item.condition) };
        }
        if (typeof item.stock === "number") {
            return { label: "Stock", value: String(item.stock) };
        }
        return { label: "Part Condition", value: "Not specified" };
    }

    if (item.deviceCondition === "power_off" || item.devicePowerOn === false) {
        return { label: "Condition", value: "Power Off" };
    }
    if (item.deviceCondition === "power_on" || item.devicePowerOn === true) {
        return { label: "Condition", value: "Working" };
    }
    if (item.condition) {
        return { label: "Condition", value: startCase(item.condition) };
    }

    return { label: "Condition", value: "Not specified" };
};
