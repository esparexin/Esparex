

import type { Metadata } from "next";
import { InfoPage } from "@/components/common/InfoPage";

export const metadata: Metadata = {
    title: "How It Works | Esparex",
    description: "Learn how to buy, sell, and find repair services on Esparex — India's marketplace for mobile spare parts and electronics.",
    alternates: { canonical: "https://esparex.in/how-it-works" },
    openGraph: {
        title: "How It Works | Esparex",
        description: "Learn how to buy, sell, and find repair services on Esparex — India's marketplace for mobile spare parts and electronics.",
        url: "https://esparex.in/how-it-works",
        images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
};

export default function HowItWorksPage() {
    return (
        <InfoPage title="How Esparex Works">
            <div className="space-y-4 not-prose">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">1</div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm mb-1">For Buyers</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">Browse thousands of spare parts and services. Use our advanced filters to find parts compatible with your specific device model. Contact sellers directly to negotiate and arrange pickup or delivery.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-green-50 border border-green-100">
                    <div className="h-9 w-9 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">2</div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm mb-1">For Sellers</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">List your spare parts in minutes. Take clear photos, describe the condition, and set your price. Manage all your listings and offers from your dashboard.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-violet-50 border border-violet-100">
                    <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">3</div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm mb-1">For Service Providers</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">Register your repair shop to get discovered by local customers. Showcase your expertise and services offered.</p>
                    </div>
                </div>
            </div>
        </InfoPage>
    );
}
