import { InfoPage } from "@/components/common/InfoPage";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sitemap | Esparex",
    description: "Explore all marketplace categories, services, support guides, and legal policies on Esparex.",
    alternates: { canonical: "https://esparex.in/site-map" },
    openGraph: {
        title: "Sitemap | Esparex",
        description: "Explore all marketplace categories, services, support guides, and legal policies on Esparex.",
        url: "https://esparex.in/site-map",
        images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
};

export default function SiteMapPage() {
    return (
        <InfoPage title="Sitemap" containerVariant="md">
            <div className="flex flex-col gap-6 not-prose">
                <p className="text-body text-foreground-secondary leading-relaxed">
                    Quick directory of all public sections, search categories, support documentation, and policy pages across the Esparex platform.
                </p>

                <div className="flex flex-wrap gap-4 [&>*]:flex-1 [&>*]:min-w-[200px]">
                    {/* Marketplace & Discovery */}
                    <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
                        <h2 className="font-bold mb-3 text-body text-foreground">Marketplace</h2>
                        <ul className="flex flex-col gap-2 text-caption">
                            <li><Link href="/" className="text-foreground-secondary hover:text-primary transition-colors block">Home</Link></li>
                            <li><Link href="/search" className="text-foreground-secondary hover:text-primary transition-colors block">Browse All Ads</Link></li>
                            <li><Link href="/spare-parts" className="text-foreground-secondary hover:text-primary transition-colors block">Spare Parts Catalog</Link></li>
                            <li><Link href="/services" className="text-foreground-secondary hover:text-primary transition-colors block">Repair Services</Link></li>
                            <li><Link href="/search?type=business" className="text-foreground-secondary hover:text-primary transition-colors block">Verified Businesses</Link></li>
                        </ul>
                    </div>

                    {/* Electronics Categories */}
                    <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
                        <h2 className="font-bold mb-3 text-body text-foreground">Categories</h2>
                        <ul className="flex flex-col gap-2 text-caption">
                            <li><Link href="/category/mobile-phones" className="text-foreground-secondary hover:text-primary transition-colors block">Mobile Phones</Link></li>
                            <li><Link href="/category/tablets" className="text-foreground-secondary hover:text-primary transition-colors block">Tablets</Link></li>
                            <li><Link href="/category/laptops" className="text-foreground-secondary hover:text-primary transition-colors block">Laptops &amp; Computers</Link></li>
                            <li><Link href="/category/spare-parts" className="text-foreground-secondary hover:text-primary transition-colors block">Displays &amp; Spare Parts</Link></li>
                            <li><Link href="/category/accessories" className="text-foreground-secondary hover:text-primary transition-colors block">Accessories &amp; Tools</Link></li>
                        </ul>
                    </div>

                    {/* Support & Guides */}
                    <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
                        <h2 className="font-bold mb-3 text-body text-foreground">Support &amp; Company</h2>
                        <ul className="flex flex-col gap-2 text-caption">
                            <li><Link href="/about" className="text-foreground-secondary hover:text-primary transition-colors block">About Esparex</Link></li>
                            <li><Link href="/how-it-works" className="text-foreground-secondary hover:text-primary transition-colors block">How It Works</Link></li>
                            <li><Link href="/faq" className="text-foreground-secondary hover:text-primary transition-colors block">Help Center &amp; FAQ</Link></li>
                            <li><Link href="/safety-tips" className="text-foreground-secondary hover:text-primary transition-colors block">Trust &amp; Safety Tips</Link></li>
                            <li><Link href="/contact" className="text-foreground-secondary hover:text-primary transition-colors block">Contact Support</Link></li>
                        </ul>
                    </div>

                    {/* Legal & Compliance */}
                    <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
                        <h2 className="font-bold mb-3 text-body text-foreground">Legal &amp; Compliance</h2>
                        <ul className="flex flex-col gap-2 text-caption">
                            <li><Link href="/terms" className="text-foreground-secondary hover:text-primary transition-colors block">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="text-foreground-secondary hover:text-primary transition-colors block">Privacy Policy</Link></li>
                            <li><Link href="/terms#prohibited-goods" className="text-foreground-secondary hover:text-primary transition-colors block">Prohibited Content Rules</Link></li>
                            <li><Link href="/contact#grievance-officer" className="text-foreground-secondary hover:text-primary transition-colors block">Grievance Redressal</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </InfoPage>
    );
}
