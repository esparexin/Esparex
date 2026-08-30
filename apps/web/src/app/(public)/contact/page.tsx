import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/common/InfoPage";
import { Mail, MapPin, Phone, ShieldCheck, HelpCircle } from "@/icons/IconRegistry";
import {
    LEGAL_COMPANY_NAME,
    LEGAL_COMPANY_LOCATION,
    LEGAL_SUPPORT_EMAIL,
    LEGAL_GRIEVANCE_EMAIL,
    LEGAL_BUSINESS_EMAIL,
    LEGAL_SUPPORT_PHONE,
    LEGAL_GRIEVANCE_OFFICER,
    LEGAL_GRIEVANCE_DESIGNATION
} from "@/lib/legal";

export const metadata: Metadata = {
    title: "Contact Us & Grievance Redressal | Esparex",
    description: "Get in touch with the Esparex customer support, B2B wholesale partnerships, or statutory Grievance Redressal desk.",
    alternates: { canonical: "https://esparex.in/contact" },
    openGraph: {
        title: "Contact Us & Grievance Redressal | Esparex",
        description: "Official contact information, customer support phone, B2B business inquiries, and Grievance Officer details for Esparex.",
        url: "https://esparex.in/contact",
        images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
};

export default function ContactPage() {
    return (
        <InfoPage title="Contact Us &amp; Help Desk" containerVariant="md">
            <div className="space-y-8 not-prose">
                <p className="text-body text-foreground-secondary leading-relaxed">
                    Have questions about an ad, need assistance with your account, or want to partner as a verified wholesale distributor or repair center? We are here to help.
                </p>

                {/* Contact Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border shadow-xs">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-tiny font-bold text-foreground-subtle uppercase tracking-wider">Customer Support</p>
                            <a href={`mailto:${LEGAL_SUPPORT_EMAIL}`} className="text-caption font-semibold text-foreground hover:text-primary transition-colors block mt-0.5">
                                {LEGAL_SUPPORT_EMAIL}
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border shadow-xs">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Phone className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-tiny font-bold text-foreground-subtle uppercase tracking-wider">Phone Helpline</p>
                            <a href={`tel:${LEGAL_SUPPORT_PHONE.replace(/\s+/g, '')}`} className="text-caption font-semibold text-foreground hover:text-primary transition-colors block mt-0.5">
                                {LEGAL_SUPPORT_PHONE}
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border shadow-xs">
                        <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                            <MapPin className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-tiny font-bold text-foreground-subtle uppercase tracking-wider">Registered Office</p>
                            <p className="text-caption font-semibold text-foreground mt-0.5">{LEGAL_COMPANY_LOCATION}</p>
                        </div>
                    </div>
                </div>

                {/* Business & Partnerships */}
                <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
                    <h2 className="text-h3 font-bold text-foreground">B2B Wholesale &amp; Partnerships</h2>
                    <p className="text-caption text-foreground-secondary leading-relaxed">
                        Are you an electronic component importer, spare parts wholesaler, or multi-location repair chain? Partner with Esparex to list verified bulk inventory and access thousands of technicians across India.
                    </p>
                    <p className="text-caption text-foreground-secondary">
                        Reach our business operations team directly at:{" "}
                        <a href={`mailto:${LEGAL_BUSINESS_EMAIL}`} className="text-primary hover:underline font-semibold">
                            {LEGAL_BUSINESS_EMAIL}
                        </a>
                    </p>
                </div>

                {/* Statutory Grievance Redressal Desk */}
                <div className="p-6 rounded-2xl bg-muted/30 border border-border shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <h2 className="text-h3 font-bold text-foreground">Statutory Grievance Redressal Desk</h2>
                    </div>

                    <p className="text-caption text-foreground-secondary leading-relaxed">
                        In accordance with the Information Technology Act, 2000 and Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and the Digital Personal Data Protection Act, 2023, users may submit legal notices, copyright takedown requests, or consumer complaints to our designated Grievance Officer:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-card border border-border text-caption">
                        <div className="space-y-1">
                            <p className="font-bold text-foreground">{LEGAL_GRIEVANCE_OFFICER}</p>
                            <p className="text-foreground-secondary">{LEGAL_GRIEVANCE_DESIGNATION}</p>
                            <p className="text-foreground-secondary">{LEGAL_COMPANY_NAME}</p>
                            <p className="text-foreground-secondary">{LEGAL_COMPANY_LOCATION}</p>
                        </div>
                        <div className="space-y-1">
                            <p><strong>Grievance Email:</strong> <a href={`mailto:${LEGAL_GRIEVANCE_EMAIL}`} className="text-primary hover:underline font-medium">{LEGAL_GRIEVANCE_EMAIL}</a></p>
                            <p><strong>Direct Helpline:</strong> <a href={`tel:${LEGAL_SUPPORT_PHONE.replace(/\s+/g, '')}`} className="text-primary hover:underline font-medium">{LEGAL_SUPPORT_PHONE}</a></p>
                            <p className="text-foreground-subtle text-tiny mt-2">
                                ⏱️ <em>Grievances are acknowledged within 24 hours and resolved within 15 working days.</em>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Help Links */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-caption text-foreground-secondary pt-2">
                    <Link href="/faq" className="hover:text-primary transition-colors flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5" />
                        Browse Help Center &amp; FAQ
                    </Link>
                    <span>•</span>
                    <Link href="/safety-tips" className="hover:text-primary transition-colors">
                        Read Safety Tips
                    </Link>
                    <span>•</span>
                    <Link href="/terms" className="hover:text-primary transition-colors">
                        Terms of Service
                    </Link>
                    <span>•</span>
                    <Link href="/privacy" className="hover:text-primary transition-colors">
                        Privacy Policy
                    </Link>
                </div>
            </div>
        </InfoPage>
    );
}
