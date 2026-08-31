import {
    LEGAL_COMPANY_NAME,
    LEGAL_COMPANY_LOCATION,
    LEGAL_SUPPORT_EMAIL,
    LEGAL_SUPPORT_PHONE,
    LEGAL_GRIEVANCE_OFFICER,
    LEGAL_GRIEVANCE_EMAIL
} from "@/lib/legal";

export interface WebPageSchemaOptions {
    name: string;
    description: string;
    url: string;
    datePublished?: string;
    dateModified?: string;
}

export function buildWebPageSchema({
    name,
    description,
    url,
    datePublished = "2026-08-26",
    dateModified = "2026-08-26"
}: WebPageSchemaOptions) {
    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name,
        description,
        url,
        datePublished,
        dateModified,
        inLanguage: "en-IN",
        publisher: {
            "@type": "Organization",
            name: LEGAL_COMPANY_NAME,
            url: "https://esparex.in",
            logo: {
                "@type": "ImageObject",
                url: "https://esparex.in/icons/brand-mark.png"
            }
        }
    };
}

export function buildContactPageSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Contact Us & Grievance Redressal | Esparex",
        description: "Official contact details, customer helpline, and statutory Grievance Officer for Esparex.",
        url: "https://esparex.in/contact",
        mainEntity: {
            "@type": "Organization",
            name: LEGAL_COMPANY_NAME,
            url: "https://esparex.in",
            address: {
                "@type": "PostalAddress",
                addressLocality: "Hyderabad",
                addressRegion: "Telangana",
                addressCountry: "IN"
            },
            contactPoint: [
                {
                    "@type": "ContactPoint",
                    telephone: LEGAL_SUPPORT_PHONE,
                    contactType: "customer support",
                    email: LEGAL_SUPPORT_EMAIL,
                    areaServed: "IN",
                    availableLanguage: ["en", "hi", "te"]
                },
                {
                    "@type": "ContactPoint",
                    contactType: "Grievance Officer",
                    name: LEGAL_GRIEVANCE_OFFICER,
                    email: LEGAL_GRIEVANCE_EMAIL,
                    areaServed: "IN"
                }
            ]
        }
    };
}

export function buildAboutPageSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "About Esparex | India's Electronics & Spare Parts Marketplace",
        description: "Esparex is India's dedicated circular economy marketplace for smartphone spare parts, electronics, and repair services.",
        url: "https://esparex.in/about",
        mainEntity: {
            "@type": "Organization",
            name: LEGAL_COMPANY_NAME,
            url: "https://esparex.in",
            location: LEGAL_COMPANY_LOCATION,
            sameAs: [
                "https://twitter.com/esparexin",
                "https://facebook.com/esparexin",
                "https://instagram.com/esparexin"
            ]
        }
    };
}

export function buildCollectionPageSchema(name: string, description: string, url: string) {
    return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name,
        description,
        url,
        inLanguage: "en-IN",
        isPartOf: {
            "@type": "WebSite",
            name: "Esparex",
            url: "https://esparex.in"
        }
    };
}
