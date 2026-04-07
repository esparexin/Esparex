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
            <div className="grid md:grid-cols-2 gap-8 not-prose">
                <div>
                    <h3 className="font-bold mb-4 text-lg">Main</h3>
                    <ul className="space-y-2">
                        <li><Link href="/" className="text-link hover:underline">Home</Link></li>
                        <li><Link href="/search" className="text-link hover:underline">Browse Ads</Link></li>
                        <li><Link href="/search" className="text-link hover:underline">All Categories</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-bold mb-4 text-lg">Support</h3>
                    <ul className="space-y-2">
                        <li><Link href="/faq" className="text-link hover:underline">Help Center</Link></li>
                        <li><Link href="/contact" className="text-link hover:underline">Contact Us</Link></li>
                        <li><Link href="/safety-tips" className="text-link hover:underline">Safety Tips</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-bold mb-4 text-lg">Legal</h3>
                    <ul className="space-y-2">
                        <li><Link href="/terms" className="text-link hover:underline">Terms of Service</Link></li>
                        <li><Link href="/privacy" className="text-link hover:underline">Privacy Policy</Link></li>
                    </ul>
                </div>
            </div>
        </InfoPage>
    );
}
