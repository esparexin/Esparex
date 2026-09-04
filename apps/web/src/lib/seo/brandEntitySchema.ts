import {
    LEGAL_COMPANY_NAME,
    LEGAL_SUPPORT_EMAIL,
    LEGAL_SUPPORT_PHONE,
} from "@/lib/legal";
import { CANONICAL_ORIGIN } from "@/lib/seo/canonicalHost";

/**
 * Builds authoritative Organization structured data (Schema.org)
 * Disambiguates Esparex as an Indian electronics marketplace brand entity.
 */
export function buildOrganizationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${CANONICAL_ORIGIN}/#organization`,
        name: "Esparex",
        alternateName: ["Esparex Marketplace", "Esparex India", "Esparex.in"],
        legalName: LEGAL_COMPANY_NAME,
        url: CANONICAL_ORIGIN,
        logo: {
            "@type": "ImageObject",
            url: `${CANONICAL_ORIGIN}/icons/brand-mark.png`,
        },
        description: "India's marketplace for genuine mobile spare parts, refurbished electronics, and repair services.",
        areaServed: {
            "@type": "Country",
            name: "India",
        },
        knowsAbout: [
            "Mobile Spare Parts",
            "Phone Repair Services",
            "Used Smartphones",
            "Electronics Marketplace",
        ],
        contactPoint: [
            {
                "@type": "ContactPoint",
                telephone: LEGAL_SUPPORT_PHONE,
                contactType: "customer support",
                email: LEGAL_SUPPORT_EMAIL,
                areaServed: "IN",
                availableLanguage: ["en", "hi", "te"],
            },
        ],
        sameAs: [
            "https://twitter.com/esparexin",
            "https://facebook.com/esparexin",
            "https://instagram.com/esparexin",
        ],
    };
}

/**
 * Builds WebSite structured data linked to the publisher Organization.
 */
export function buildWebSiteSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${CANONICAL_ORIGIN}/#website`,
        name: "Esparex",
        url: `${CANONICAL_ORIGIN}/`,
        publisher: {
            "@id": `${CANONICAL_ORIGIN}/#organization`,
        },
        potentialAction: {
            "@type": "SearchAction",
            target: `${CANONICAL_ORIGIN}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
        },
    };
}
