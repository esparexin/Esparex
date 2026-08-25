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
            <p className="mb-5 text-foreground-secondary text-body leading-relaxed">
                Whether you{"'"}re looking to offload old electronics, source bulk iPhone displays, or find a technician to fix your shattered screen, Esparex is built to make the process completely seamless and transparent.
            </p>
            <div className="space-y-4 not-prose">
                <div className="flex flex-col sm:flex-row items-start gap-4 p-4 md:p-5 rounded-2xl bg-card border border-border shadow-xs">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0 text-primary-foreground font-bold text-body-lg shadow-xs">1</div>
                    <div className="flex-1">
                        <h3 className="font-bold text-foreground text-body-lg mb-1.5">For Buyers: Finding the Perfect Part</h3>
                        <p className="text-caption text-foreground-secondary leading-relaxed mb-3">
                            Tired of gambling on unverified sources? Esparex brings a heavily vetted catalog of wholesale suppliers and individual sellers into one unified search engine.
                        </p>
                        <ul className="text-caption text-foreground-secondary list-disc pl-5 space-y-1">
                            <li>Use advanced filters to instantly filter by exact Device Brand and Model so you never order the wrong flex cable again.</li>
                            <li>Look for the <span className="font-semibold text-foreground">&quot;Verified Business&quot;</span> shield to buy confidently from registered wholesale distributors.</li>
                            <li>Found what you need? Use our instant chat to negotiate the final price and arrange a local pickup or delivery directly with the seller.</li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4 p-4 md:p-5 rounded-2xl bg-card border border-border shadow-xs">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0 text-primary-foreground font-bold text-body-lg shadow-xs">2</div>
                    <div className="flex-1">
                        <h3 className="font-bold text-foreground text-body-lg mb-1.5">For Sellers: Turning Inventory into Cash</h3>
                        <p className="text-caption text-foreground-secondary leading-relaxed mb-3">
                            Whether you{"'"}re stripping a broken phone for OEM parts or running a massive B2B repair shop, posting on Esparex takes less than 60 seconds.
                        </p>
                        <ul className="text-caption text-foreground-secondary list-disc pl-5 space-y-1">
                            <li>Click &quot;Post Ad&quot; to snap clear photos and categorize your item exactly. Be specific about whether it is an OEM pull or an aftermarket compatible part.</li>
                            <li>Leverage our hyper-local radius matching so buyers right in your city find your inventory first.</li>
                            <li>Boost your listings using the &quot;Ads Spotlight&quot; premium feature to pin your parts to the top of the search algorithm.</li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4 p-4 md:p-5 rounded-2xl bg-card border border-border shadow-xs">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0 text-primary-foreground font-bold text-body-lg shadow-xs">3</div>
                    <div className="flex-1">
                        <h3 className="font-bold text-foreground text-body-lg mb-1.5">For Service Providers & Technicians</h3>
                        <p className="text-caption text-foreground-secondary leading-relaxed mb-3">
                            Are you a micro-soldering expert or a quick screen-replacement wizard? Don{"'"}t let your skills sit undiscovered.
                        </p>
                        <ul className="text-caption text-foreground-secondary list-disc pl-5 space-y-1">
                            <li>List your Repair Services by defining the specific devices you service and your standard rates.</li>
                            <li>Offer &quot;On-Site&quot; repair or &quot;Shop Walk-in&quot; depending on your capability. Customers can view your turnaround times instantly.</li>
                            <li>Build a glowing reputation with reviews and dominate the local repair market without paying massive lead-generation fees.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </InfoPage>
    );
}
