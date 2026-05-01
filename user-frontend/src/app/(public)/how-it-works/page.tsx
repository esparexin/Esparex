import type { Metadata } from "next";
import { InfoPage } from "@/components/common/InfoPage";

export const metadata: Metadata = {
    title: "How It Works | Esparex",
    description: "Discover how easy it is to buy, sell, and find professional repair services on Esparex — India's trusted marketplace for mobile spare parts and electronics.",
    alternates: { canonical: "https://esparex.in/how-it-works" },
    openGraph: {
        title: "How It Works | Esparex",
        description: "Discover how easy it is to buy, sell, and find professional repair services on Esparex.",
        url: "https://esparex.in/how-it-works",
        images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
};

export default function HowItWorksPage() {
    return (
        <InfoPage title="How Esparex Works">
            <p className="mb-6 text-muted-foreground text-base leading-relaxed">
                Whether you're looking to offload old electronics, source bulk iPhone displays, or find a technician to fix your shattered screen, Esparex is built to make the process completely seamless and transparent.
            </p>
            <div className="space-y-6 not-prose">
                <div className="flex flex-col md:flex-row items-stretch gap-4 p-6 rounded-2xl bg-blue-50/50 border border-blue-100 shadow-sm">
                    <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xl shadow-md">1</div>
                    <div>
                        <h3 className="font-bold text-blue-900 text-lg mb-2">For Buyers: Finding the Perfect Part</h3>
                        <p className="text-sm text-blue-800/80 leading-relaxed mb-3">
                            Tired of gambling on unverified sources? Esparex brings a heavily vetted catalog of wholesale suppliers and individual sellers into one unified search engine.
                        </p>
                        <ul className="text-sm text-blue-900/70 list-disc pl-5 space-y-1">
                            <li>Use advanced filters to instantly filter by exact Device Brand and Model so you never order the wrong flex cable again.</li>
                            <li>Look for the <span className="font-semibold text-blue-800">"Verified Business"</span> shield to buy confidently from registered wholesale distributors.</li>
                            <li>Found what you need? Use our instant chat to negotiate the final price and arrange a local pickup or delivery directly with the seller.</li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-stretch gap-4 p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 shadow-sm">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xl shadow-md">2</div>
                    <div>
                        <h3 className="font-bold text-emerald-900 text-lg mb-2">For Sellers: Turning Inventory into Cash</h3>
                        <p className="text-sm text-emerald-800/80 leading-relaxed mb-3">
                            Whether you're stripping a broken phone for OEM parts or running a massive B2B repair shop, posting on Esparex takes less than 60 seconds.
                        </p>
                        <ul className="text-sm text-emerald-900/70 list-disc pl-5 space-y-1">
                            <li>Click "Post Ad" to snap clear photos and categorize your item exactly. Be specific about whether it is an OEM pull or an aftermarket compatible part.</li>
                            <li>Leverage our hyper-local radius matching so buyers right in your city find your inventory first.</li>
                            <li>Boost your listings using the "Ads Spotlight" premium feature to pin your parts to the top of the search algorithm.</li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-stretch gap-4 p-6 rounded-2xl bg-violet-50/50 border border-violet-100 shadow-sm">
                    <div className="h-12 w-12 rounded-2xl bg-violet-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xl shadow-md">3</div>
                    <div>
                        <h3 className="font-bold text-violet-900 text-lg mb-2">For Service Providers & Technicians</h3>
                        <p className="text-sm text-violet-800/80 leading-relaxed mb-3">
                            Are you a micro-soldering expert or a quick screen-replacement wizard? Don't let your skills sit undiscovered.
                        </p>
                        <ul className="text-sm text-violet-900/70 list-disc pl-5 space-y-1">
                            <li>List your Repair Services by defining the specific devices you service and your standard rates.</li>
                            <li>Offer "On-Site" repair or "Shop Walk-in" depending on your capability. Customers can view your turnaround times instantly.</li>
                            <li>Build a glowing reputation with reviews and dominate the local repair market without paying massive lead-generation fees.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </InfoPage>
    );
}
