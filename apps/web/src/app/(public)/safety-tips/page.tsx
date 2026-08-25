import type { Metadata } from "next";
import { InfoPage } from "@/components/common/InfoPage";
import { AlertTriangle, ShieldCheck, MapPin, Search } from "@/icons/IconRegistry";

export const metadata: Metadata = {
    title: "Safety Tips | Esparex",
    description: "Stay safe when buying and selling on Esparex. Tips to avoid scams, verify sellers, and transact securely.",
    alternates: { canonical: "https://esparex.in/safety-tips" },
    openGraph: {
        title: "Safety Tips | Esparex",
        description: "Stay safe when buying and selling on Esparex. Tips to avoid scams, verify sellers, and transact securely.",
        url: "https://esparex.in/safety-tips",
        images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
};

export default function SafetyTipsPage() {
    return (
        <InfoPage title="Trust & Safety Guidelines">
            <div className="flex items-start gap-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 not-prose shadow-xs">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                </div>
                <div>
                    <h3 className="text-body font-bold text-foreground mb-1">Our Commitment to Safety</h3>
                    <p className="text-caption text-foreground-secondary leading-relaxed">
                        Esparex actively monitors listings and verifies B2B businesses to keep our community safe. However, in any open marketplace, vigilance is your best defense against fraud.
                    </p>
                </div>
            </div>

            <div className="space-y-6 not-prose">
                <section>
                    <div className="flex items-center gap-2.5 mb-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-h3 font-bold text-foreground">Golden Rules of Buying</h3>
                    </div>
                    <div className="space-y-3 text-body text-foreground-secondary leading-relaxed">
                        <p><strong>1. Never pay in advance:</strong> Do not transfer money (via UPI, bank transfer, or digital wallets) to individual sellers before inspecting the spare part or device in person. Be cautious of sellers demanding {"\""}booking fees{"\""} or {"\""}shipping charges{"\""} upfront.</p>
                        <p><strong>2. Use Esparex Chat:</strong> Do not move conversations to WhatsApp or Telegram immediately. Keeping your negotiations and proof of agreements within the Esparex chat portal protects you in case you need to report abusive or fraudulent behavior.</p>
                        <p><strong>3. Buy from Verified Businesses:</strong> Whenever possible, purchase critical components (like screens or motherboards) from sellers with the <span className="font-semibold text-emerald-600">{"\""}Verified Business{"\""}</span> shield. These sellers have legitimate GST registrations on file with us.</p>
                    </div>
                </section>

                <hr className="border-border" />

                <section>
                    <div className="flex items-center gap-2.5 mb-3">
                        <Search className="h-5 w-5 text-primary" />
                        <h3 className="text-h3 font-bold text-foreground">Golden Rules of Selling</h3>
                    </div>
                    <div className="space-y-3 text-body text-foreground-secondary leading-relaxed">
                        <p><strong>1. Verify the Payment:</strong> If completing a transaction digitally at a meetup, wait until you see the SMS from your *own bank* confirming the deposit. Do not rely solely on screenshots shown by the buyer, as fake UPI payment apps do exist in the wild.</p>
                        <p><strong>2. Be Transparent:</strong> Clearly state if a part is OEM, refurbished, or an aftermarket compatible component. Disclosing minor faults prevents post-sale disputes and builds your long-term reputation.</p>
                        <p><strong>3. Protect Your Personal Info:</strong> Do not share your home address, Aadhaar number, or credit card details via chat. Share your shop address or a public location.</p>
                    </div>
                </section>

                <hr className="border-border" />

                <section>
                    <div className="flex items-center gap-2.5 mb-3">
                        <MapPin className="h-5 w-5 text-violet-600" />
                        <h3 className="text-h3 font-bold text-foreground">Meetup Guidelines</h3>
                    </div>
                    <div className="space-y-3 text-body text-foreground-secondary leading-relaxed">
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Always agree to meet in well-lit, highly populated public areas (e.g., malls, popular cafes, or near police stations).</li>
                            <li>If you are buying a replacement part like an iPhone battery or display, bring the tools necessary to test it *before* handing over the cash, or arrange to meet at a neutral technician{"'"}s shop.</li>
                            <li>Trust your instincts. If a deal feels too good to be true, or the other party refuses to meet in a public location, walk away.</li>
                        </ul>
                    </div>
                </section>
            </div>
        </InfoPage>
    );
}
