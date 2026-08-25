import { InfoPage } from "@/components/common/InfoPage";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sitemap | Esparex",
    description: "Explore all main, support, and legal pages available on Esparex.",
    alternates: { canonical: "https://esparex.in/site-map" },
    openGraph: {
        title: "Sitemap | Esparex",
        description: "Explore all main, support, and legal pages available on Esparex.",
        url: "https://esparex.in/site-map",
        images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
};

export default function SiteMapPage() {
    return (
        <InfoPage title="Sitemap">
            <div className="grid sm:grid-cols-3 gap-6 not-prose">
                <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
                    <h2 className="font-bold mb-3 text-body-lg text-foreground">Main</h2>
                    <ul className="space-y-2 text-caption">
                        <li><Link href="/" className="text-foreground-secondary hover:text-primary transition-colors">Home</Link></li>
                        <li><Link href="/search" className="text-foreground-secondary hover:text-primary transition-colors">Browse Ads</Link></li>
                        <li><Link href="/search" className="text-foreground-secondary hover:text-primary transition-colors">All Categories</Link></li>
                    </ul>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
                    <h2 className="font-bold mb-3 text-body-lg text-foreground">Support</h2>
                    <ul className="space-y-2 text-caption">
                        <li><Link href="/faq" className="text-foreground-secondary hover:text-primary transition-colors">Help Center</Link></li>
                        <li><Link href="/contact" className="text-foreground-secondary hover:text-primary transition-colors">Contact Us</Link></li>
                        <li><Link href="/safety-tips" className="text-foreground-secondary hover:text-primary transition-colors">Safety Tips</Link></li>
                    </ul>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
                    <h2 className="font-bold mb-3 text-body-lg text-foreground">Legal</h2>
                    <ul className="space-y-2 text-caption">
                        <li><Link href="/terms" className="text-foreground-secondary hover:text-primary transition-colors">Terms of Service</Link></li>
                        <li><Link href="/privacy" className="text-foreground-secondary hover:text-primary transition-colors">Privacy Policy</Link></li>
                    </ul>
                </div>
            </div>
        </InfoPage>
    );
}
