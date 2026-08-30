import type { Metadata } from "next";
import { InfoPage } from "@/components/common/InfoPage";
import {
    AlertTriangle,
    ShieldCheck,
    MapPin,
    Search,
    CreditCard,
    Flag,
    HelpCircle,
    CheckCircle
} from "@/icons/IconRegistry";
import {
    LEGAL_GRIEVANCE_EMAIL,
    LEGAL_SUPPORT_PHONE
} from "@/lib/legal";

export const metadata: Metadata = {
    title: "Trust & Safety Guidelines | Esparex",
    description: "Essential safety guidelines, scam prevention tips, meetup checklists, and reporting procedures for buying and selling electronics on Esparex.",
    alternates: { canonical: "https://esparex.in/safety-tips" },
    openGraph: {
        title: "Trust & Safety Guidelines | Esparex",
        description: "Stay secure on Esparex. Learn how to verify sellers, avoid online payment scams, inspect spare parts safely, and report suspicious listings.",
        url: "https://esparex.in/safety-tips",
        images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
};

export default function SafetyTipsPage() {
    return (
        <InfoPage title="Trust &amp; Safety Guidelines" containerVariant="md">
            {/* Safety Commitment Banner */}
            <div className="flex items-start gap-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-5 not-prose shadow-xs">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                </div>
                <div>
                    <h2 className="text-body-lg font-bold text-foreground mb-1">Our Commitment to Community Safety</h2>
                    <p className="text-caption text-foreground-secondary leading-relaxed">
                        Esparex actively verifies business sellers with statutory KYC and GST checks, scans listings with AI visual moderation, and monitors chat for fraud patterns. However, staying informed and vigilant during physical meetups and digital payments is your strongest protection against scams.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-8 not-prose">
                {/* Golden Rules: Buyers vs Sellers */}
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Buyer Rules */}
                    <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                            </div>
                            <h3 className="text-h3 font-bold text-foreground">Golden Rules for Buyers</h3>
                        </div>
                        <ul className="flex flex-col gap-3 text-caption text-foreground-secondary">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-600 font-bold mt-0.5">1.</span>
                                <div>
                                    <strong className="text-foreground">Never Send Advance Payments:</strong> Do not transfer money (via UPI, bank transfer, or gift cards) prior to physically inspecting and testing the spare part or device in person.
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-600 font-bold mt-0.5">2.</span>
                                <div>
                                    <strong className="text-foreground">Look for the Verified Business Shield:</strong> For critical parts (screens, motherboards), prioritize sellers bearing the green <span className="font-semibold text-emerald-600">&quot;Verified Business&quot;</span> badge with verified GSTIN and shop registration.
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-600 font-bold mt-0.5">3.</span>
                                <div>
                                    <strong className="text-foreground">Keep Chat On-Platform:</strong> Avoid moving negotiations immediately to WhatsApp or Telegram. Keeping records within Esparex chat ensures you are protected in case a dispute arises.
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-600 font-bold mt-0.5">4.</span>
                                <div>
                                    <strong className="text-foreground">Verify Model Fitment:</strong> Check exact device model numbers (e.g., SM-G991B vs SM-G991U) before purchasing displays, charging flexes, or batteries to ensure fitting.
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Seller Rules */}
                    <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Search className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <h3 className="text-h3 font-bold text-foreground">Golden Rules for Sellers</h3>
                        </div>
                        <ul className="flex flex-col gap-3 text-caption text-foreground-secondary">
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold mt-0.5">1.</span>
                                <div>
                                    <strong className="text-foreground">Verify Inbound Bank SMS:</strong> Never rely on payment screenshots shown by the buyer. Always check your own bank app or official bank SMS to confirm funds have credited before handing over the item.
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold mt-0.5">2.</span>
                                <div>
                                    <strong className="text-foreground">Disclose Part Authenticity:</strong> Always declare whether a part is original OEM, refurbished, or compatible aftermarket. Accurate disclosures build long-term reputation and prevent disputes.
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold mt-0.5">3.</span>
                                <div>
                                    <strong className="text-foreground">Protect Personal Address:</strong> Individual sellers should share public meeting spots rather than private home addresses. Commercial sellers should list their verified shop location.
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold mt-0.5">4.</span>
                                <div>
                                    <strong className="text-foreground">Beware of Fake QR Codes:</strong> Remember: you <em>never</em> need to enter your UPI PIN or scan a QR code to &quot;receive&quot; money. Scanning a QR code always debits your account.
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Common Scams to Watch Out For */}
                <section className="p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <CreditCard className="h-4.5 w-4.5 text-destructive" />
                        </div>
                        <h3 className="text-h3 font-bold text-foreground">Recognizing Common Fraud Patterns</h3>
                    </div>

                    <div className="flex flex-wrap gap-4 [&>*]:flex-1 [&>*]:min-w-[240px]">
                        <div className="p-4 rounded-xl bg-muted/40 border border-border text-caption flex flex-col gap-1.5">
                            <p className="font-bold text-foreground">1. Fake UPI Screenshot Simulation</p>
                            <p className="text-foreground-secondary">
                                Scammers use spoofed mobile apps that generate realistic fake &quot;Payment Successful&quot; screens. <strong>Defense:</strong> Check your own bank account balance or wait for your bank&apos;s confirmation SMS before releasing merchandise.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-muted/40 border border-border text-caption flex flex-col gap-1.5">
                            <p className="font-bold text-foreground">2. &quot;Scan QR Code to Receive Money&quot; Trap</p>
                            <p className="text-foreground-secondary">
                                Fraudulent buyers send a QR code claiming it will transfer funds into your wallet once scanned. <strong>Defense:</strong> Entering a UPI PIN or scanning a code ONLY authorizes an outgoing payment from your bank.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-muted/40 border border-border text-caption flex flex-col gap-1.5">
                            <p className="font-bold text-foreground">3. Advance Courier / Booking Fee Demand</p>
                            <p className="text-foreground-secondary">
                                An out-of-town seller offers an unrealistically cheap device and demands an advance courier fee via UPI. Once paid, the seller vanishes. <strong>Defense:</strong> Always transact locally in person.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-muted/40 border border-border text-caption flex flex-col gap-1.5">
                            <p className="font-bold text-foreground">4. Overpayment / Reversal Scam</p>
                            <p className="text-foreground-secondary">
                                A scammer claims they accidentally sent extra money and asks you to immediately &quot;refund&quot; the difference before the original fraudulent transfer bounces. <strong>Defense:</strong> Verify all credits with your bank branch directly.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Safe Meetup & Physical Testing Checklist */}
                <section className="p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                            <MapPin className="h-4.5 w-4.5 text-violet-600" />
                        </div>
                        <h3 className="text-h3 font-bold text-foreground">Physical Meetup &amp; Testing Checklist</h3>
                    </div>

                    <div className="flex flex-col gap-3 text-caption text-foreground-secondary">
                        <div className="flex items-start gap-2.5">
                            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                                <strong className="text-foreground">Select a Public, Busy Location:</strong> Arrange to meet during daytime in well-lit, populated areas (shopping centers, popular cafes, metro stations, or local mobile repair markets).
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                                <strong className="text-foreground">Bring Diagnostic Tools or a Neutral Technician:</strong> If buying delicate components (iPhone OLED screen, battery, logic board), meet near a trusted repair shop to plug in and test touch sensitivity, color uniformity, charging draw, and cameras.
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                                <strong className="text-foreground">Inspect Device Security &amp; Accounts:</strong> For used phones/laptops, ensure the previous owner has completely logged out of Apple iCloud, Google FRP, and Samsung accounts, and performed a factory reset in your presence.
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                                <strong className="text-foreground">Trust Your Instincts:</strong> If a deal feels too good to be true, the seller appears evasive, or pressures you to complete payment in haste, walk away immediately.
                            </div>
                        </div>
                    </div>
                </section>

                {/* Reporting & Grievance Mechanism */}
                <section className="p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Flag className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <h3 className="text-h3 font-bold text-foreground">How to Report Abuse or Scams</h3>
                    </div>
                    <p className="text-caption text-foreground-secondary leading-relaxed">
                        If you encounter a suspicious listing, counterfeit product, abusive chat message, or fraud attempt on Esparex, report it immediately:
                    </p>
                    <ol className="list-decimal pl-5 flex flex-col gap-1.5 text-caption text-foreground-secondary">
                        <li>Click the <strong>Report</strong> flag icon located on any listing page or in your active chat header.</li>
                        <li>Select the applicable violation reason: <em>Spam, Scam, Prohibited Item, Offensive Content, Misleading Info, or Sold Elsewhere</em>.</li>
                        <li>Provide details and submit. Our Trust &amp; Safety team investigates flagged reports and removes non-compliant listings.</li>
                    </ol>
                    <p className="text-caption text-foreground-secondary pt-1">
                        For urgent escalation or cybercrime grievances, email our Grievance Officer at <a href={`mailto:${LEGAL_GRIEVANCE_EMAIL}`} className="text-primary hover:underline">{LEGAL_GRIEVANCE_EMAIL}</a> or call <a href={`tel:${LEGAL_SUPPORT_PHONE.replace(/\s+/g, '')}`} className="text-primary hover:underline">{LEGAL_SUPPORT_PHONE}</a>.
                    </p>
                </section>

                {/* Child Safety & Minor Protection */}
                <section className="p-5 rounded-2xl bg-muted/40 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <HelpCircle className="h-4.5 w-4.5 text-foreground-subtle" />
                        <h4 className="text-body font-bold text-foreground">Child &amp; Minor Safety Policy</h4>
                    </div>
                    <p className="text-caption text-foreground-secondary leading-relaxed">
                        Esparex is strictly an 18+ marketplace. Minors are prohibited from conducting unattended physical meetups or financial transactions without direct parent or legal guardian supervision. We actively cooperate with cyber police authorities to prevent any illicit activity involving minors.
                    </p>
                </section>
            </div>
        </InfoPage>
    );
}
