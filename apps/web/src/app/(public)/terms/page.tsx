import { InfoPage } from "@/components/common/InfoPage";
import { Metadata } from 'next';
import Link from "next/link";
import {
    LEGAL_LAST_UPDATED,
    LEGAL_EFFECTIVE_DATE,
    LEGAL_GRIEVANCE_OFFICER,
    LEGAL_GRIEVANCE_DESIGNATION,
    LEGAL_GRIEVANCE_EMAIL,
    LEGAL_SUPPORT_EMAIL,
    LEGAL_SUPPORT_PHONE,
    LEGAL_COMPANY_LOCATION,
    LEGAL_COMPANY_NAME
} from "@/lib/legal";

export const metadata: Metadata = {
    title: 'Terms of Service | Esparex',
    description: 'Review the official Terms of Service, Marketplace User Agreement, and Ad Posting Rules for using Esparex — India\'s electronics and spare parts ecosystem.',
    alternates: { canonical: 'https://esparex.in/terms' },
    openGraph: {
        title: 'Terms of Service | Esparex',
        description: 'Read the official Terms of Service and user agreement for the Esparex marketplace.',
        url: 'https://esparex.in/terms',
        images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
};

export default function TermsPage() {
    return (
        <InfoPage title="Terms of Service" lastUpdated={LEGAL_LAST_UPDATED} containerVariant="md">
            <div className="space-y-8 text-foreground-secondary text-body leading-relaxed">
                {/* Summary Notice */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                    <p className="text-caption text-foreground-secondary leading-relaxed">
                        <strong>Effective Date:</strong> {LEGAL_EFFECTIVE_DATE} | <strong>Legal Jurisdiction:</strong> Courts of Hyderabad, Telangana, India.
                        <br />
                        Please read these Terms of Service carefully before accessing or using the Esparex Platform.
                    </p>
                </div>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">1. Agreement to Terms &amp; Eligibility</h2>
                    <p className="mb-3">
                        These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and {LEGAL_COMPANY_NAME} (&quot;Esparex&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), governing your access to and use of the Esparex website (<Link href="/" className="text-primary hover:underline">esparex.in</Link>), mobile applications, APIs, and associated marketplace services (collectively, the &quot;Platform&quot;).
                    </p>
                    <p className="mb-3">
                        <strong>Age Requirement:</strong> By registering an account or using the Platform, you represent and warrant that you are at least <strong>18 years of age</strong> and have the legal capacity to enter into a valid contract under the Indian Contract Act, 1872. If you are under 18, you may use the Platform only under the direct supervision and with the express consent of a parent or legal guardian who agrees to be bound by these Terms.
                    </p>
                    <p>
                        If you do not agree to these Terms in their entirety, you must discontinue accessing and using the Platform immediately.
                    </p>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">2. Platform Nature &amp; Intermediary Status</h2>
                    <p className="mb-3">
                        Esparex functions strictly as an <strong>online marketplace intermediary</strong> as defined under Section 2(1)(w) and Section 79 of the Information Technology Act, 2000. Our platform provides discovery, catalog search, listing display, and real-time chat communication infrastructure to connect independent buyers, individual sellers, technicians, and verified wholesale suppliers of electronics, smartphone parts, and repair services.
                    </p>
                    <div className="p-4 rounded-xl bg-card border border-border space-y-2 text-caption">
                        <p className="font-semibold text-foreground">Important Marketplace Disclaimers:</p>
                        <ul className="list-disc pl-5 space-y-1 text-foreground-secondary">
                            <li>Esparex is <strong>not an auctioneer, retailer, or manufacturer</strong> of the products or services listed on the Platform.</li>
                            <li>Esparex is <strong>not a party to any transaction</strong>, sales contract, delivery arrangement, or repair agreement negotiated between buyers and sellers.</li>
                            <li>We do not take physical custody or title of any listed item, nor do we guarantee the quality, safety, genuineness, legal ownership, or functionality of goods advertised by third-party users.</li>
                            <li>All peer-to-peer trades, on-site repairs, and financial payments are conducted directly between users at their sole discretion and risk.</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">3. User Accounts &amp; Identity Verification</h2>
                    <div className="space-y-3">
                        <p>
                            To post listings, respond to ads, or communicate with other users, you must register for an Esparex account using a valid 10-digit Indian mobile number authenticated via One-Time Password (OTP).
                        </p>
                        <ul className="list-disc pl-5 space-y-1.5 text-caption">
                            <li><strong>Account Security:</strong> You are solely responsible for maintaining the confidentiality of your mobile authentication codes and the security of devices used to access your account. You agree to notify us immediately of any unauthorized access.</li>
                            <li><strong>Single Account Policy:</strong> Each user is permitted one primary account. Creating duplicate, fraudulent, or automated bot accounts is strictly prohibited and will result in immediate termination of all associated profiles.</li>
                            <li><strong>Business Verification &amp; KYC:</strong> Users registering as a commercial business, wholesale supplier, or repair workshop must provide accurate, government-issued credentials (e.g., GSTIN, Shop &amp; Establishment Act license). Providing counterfeit, expired, or third-party business documents will result in an immediate permanent ban and referral to statutory authorities where appropriate.</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">4. Posting &amp; Advertisement Policies</h2>
                    <p className="mb-3">
                        All listings posted on Esparex must adhere to our standardized quality, safety, and transparency rules:
                    </p>
                    
                    <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-card border border-border">
                            <h3 className="text-body font-bold text-foreground mb-1">A. Permitted Categories</h3>
                            <p className="text-caption text-foreground-secondary">
                                Listings must relate directly to consumer electronics, smartphones, tablets, laptops, genuine electronic spare parts (displays, batteries, charging ports, motherboards, ICs, flex cables, housings), repair tools, testing equipment, or certified electronic repair services.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-card border border-border">
                            <h3 className="text-body font-bold text-foreground mb-1">B. Accurate Descriptions &amp; Part Authenticity</h3>
                            <p className="text-caption text-foreground-secondary mb-2">
                                Sellers must explicitly and accurately declare the true condition of every item:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-caption text-foreground-secondary">
                                <li><strong>OEM / Original:</strong> Official parts produced by or for the original device manufacturer.</li>
                                <li><strong>Refurbished:</strong> Previously used components restored to full working order with disclosed grade.</li>
                                <li><strong>Compatible / Aftermarket:</strong> Third-party replacement components. Must NOT be falsely labeled as OEM.</li>
                                <li><strong>For Parts / Non-Working:</strong> Faulty or stripped units intended for component extraction.</li>
                            </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-card border border-border">
                            <h3 className="text-body font-bold text-foreground mb-1">C. Image &amp; Media Requirements</h3>
                            <ul className="list-disc pl-5 space-y-1 text-caption text-foreground-secondary">
                                <li>Sellers must upload clear, original photographs of the <strong>actual item</strong> being sold. Minimum 1 photo, maximum 5 photos (up to 5MB per image).</li>
                                <li>Stock photos, generic internet renders, or heavily edited images that conceal defects are prohibited.</li>
                                <li>Images containing phone numbers, URL links, competitor watermarks, QR codes, or misleading text overlays are strictly forbidden and will be rejected by our automated moderation engine.</li>
                            </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-card border border-border">
                            <h3 className="text-body font-bold text-foreground mb-1">D. Content &amp; Pricing Rules</h3>
                            <ul className="list-disc pl-5 space-y-1 text-caption text-foreground-secondary">
                                <li><strong>Title:</strong> Minimum 10 characters, maximum 80 characters. Must clearly state the brand, model, and item name. No phone numbers, links, or repetitive keyword spam.</li>
                                <li><strong>Description:</strong> Minimum 20 characters, maximum 500 characters. Must describe condition, compatibility, included accessories, and faults.</li>
                                <li><strong>Transparent Pricing:</strong> Prices must be quoted accurately in Indian Rupees (INR). Posting deceptive &quot;₹1&quot; or &quot;Free&quot; placeholder pricing for high-value items is prohibited.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">5. Prohibited Products, Services &amp; Content</h2>
                    <p className="mb-3">
                        Esparex enforces a zero-tolerance policy against illegal, hazardous, or fraudulent listings. You agree NOT to post, offer, sell, or solicit any of the following on the Platform:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-caption">
                        <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/20">
                            <p className="font-bold text-destructive mb-1">🚫 Stolen &amp; Illicit Goods</p>
                            <p className="text-foreground-secondary">Stolen devices, lost property, blacklisted/blocked devices, or spare parts sourced from illegal salvage or theft.</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/20">
                            <p className="font-bold text-destructive mb-1">🚫 Counterfeit &amp; Trademark Infringements</p>
                            <p className="text-foreground-secondary">Fake or clone devices, unauthorized replicas, or aftermarket parts deceitfully branded with OEM logos.</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/20">
                            <p className="font-bold text-destructive mb-1">🚫 Cybercrime &amp; Unlawful Services</p>
                            <p className="text-foreground-secondary">IMEI altering/spoofing tools, iCloud/FRP bypass unlocking for stolen devices, SIM cloning, spyware, or hacking utilities.</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/20">
                            <p className="font-bold text-destructive mb-1">🚫 Dangerous &amp; Non-Electronics Items</p>
                            <p className="text-foreground-secondary">Damaged/swollen hazardous batteries, weapons, fireworks, adult/pornographic items, prescription pharmaceuticals, or non-tech items.</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/20">
                            <p className="font-bold text-destructive mb-1">🚫 Scams &amp; Financial Schemes</p>
                            <p className="text-foreground-secondary">Advance-fee demands, fake lottery/investment schemes, multi-level marketing (MLM), or deceptive business loan offers.</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/20">
                            <p className="font-bold text-destructive mb-1">🚫 Abusive &amp; Defamatory Material</p>
                            <p className="text-foreground-secondary">Hate speech, harassment, profanity, threats, discriminatory content, or personal contact info published without consent.</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">6. User Responsibilities &amp; Code of Conduct</h2>
                    <div className="space-y-3 text-caption">
                        <p className="text-body text-foreground-secondary">All users must conduct themselves with honesty, integrity, and safety:</p>
                        <ul className="list-disc pl-5 space-y-1.5">
                            <li><strong>Sellers:</strong> Must promptly update or mark listings as &quot;Sold&quot; when items are no longer available. Must accurately describe warranty coverage and honor agreed repair timelines.</li>
                            <li><strong>Buyers:</strong> Must physically inspect and test devices or replacement parts before completing payment. Do not send advance payments to unknown sellers without inspection.</li>
                            <li><strong>Communication:</strong> All negotiations should take place through the built-in Esparex chat system. Moving conversations to external unmonitored channels reduces our ability to assist in fraud investigations.</li>
                            <li><strong>No Spamming:</strong> Flooding the platform with duplicate listings, automated messaging, or scraping marketplace data is strictly prohibited.</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">7. Paid Services, Spotlight Ads &amp; No-Refund Policy</h2>
                    <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                        <p className="text-body font-semibold text-foreground">
                            Premium Marketplace Features:
                        </p>
                        <p className="text-caption text-foreground-secondary">
                            While standard listing on Esparex is free, we offer optional paid value-added services, including <strong>Spotlight Featured Ads</strong>, search ranking boosts, and <strong>Verified Business Storefront subscriptions</strong>.
                        </p>
                        <div className="p-3 rounded-lg bg-muted/60 border border-border text-caption">
                            <p className="font-bold text-foreground">⚠️ Strict No-Refund Policy:</p>
                            <p className="text-foreground-secondary mt-1">
                                All payments made for Spotlight ads, listing promotions, boost credits, and business storefront subscriptions are <strong>final, non-transferable, and non-refundable</strong> once the campaign is activated, published, or served on the Platform. We do not provide refunds or credits for partially used subscription periods, early ad removals by the user, or listings removed due to policy violations.
                            </p>
                            <p className="text-foreground-secondary mt-1">
                                <em>Exception:</em> In the verified event of a technical billing error resulting in duplicate charges for the exact same transaction, affected users may contact <a href={`mailto:${LEGAL_SUPPORT_EMAIL}`} className="text-primary hover:underline">{LEGAL_SUPPORT_EMAIL}</a> within 7 days with payment proof for a direct reversal.
                            </p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">8. Content Moderation &amp; Enforcement Actions</h2>
                    <p className="mb-2">
                        To maintain trust and safety, Esparex operates a hybrid automated AI and human moderation system:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-caption">
                        <li><strong>Automated Screening:</strong> Images and text are evaluated by AI classifiers to flag prohibited goods, nudity, violence, text in images, and duplicate listings.</li>
                        <li><strong>Moderation States:</strong> Listings may be marked as <em>Live</em>, <em>Held for Review</em>, <em>Rejected</em>, or <em>Community Hidden</em> based on moderation scores and user reports.</li>
                        <li><strong>Enforcement Rights:</strong> Esparex reserves the absolute right, without liability or prior notice, to edit, refuse, remove, or deactivate any listing, and to suspend or permanently ban any user account that violates these Terms, community safety, or Indian law.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">9. Intellectual Property &amp; User Content License</h2>
                    <div className="space-y-3 text-caption">
                        <p>
                            <strong>Esparex IP:</strong> All platform software, user interface design, logos, icons, trademarks, databases, and proprietary algorithms are the exclusive property of {LEGAL_COMPANY_NAME} and protected under Indian and international intellectual property laws.
                        </p>
                        <p>
                            <strong>User-Generated Content License:</strong> You retain ownership of the photos, descriptions, and text you upload. However, by posting on Esparex, you grant us a non-exclusive, worldwide, royalty-free, perpetual license to host, display, index, format, resize, and distribute your content across our platform and search engines for the purpose of operating and promoting the marketplace.
                        </p>
                        <p>
                            <strong>IP Infringement / Takedown Requests:</strong> If you believe your trademark or copyrighted work has been infringed by a listing, please notify our Grievance Officer at <a href={`mailto:${LEGAL_GRIEVANCE_EMAIL}`} className="text-primary hover:underline">{LEGAL_GRIEVANCE_EMAIL}</a> with proof of ownership and the exact listing URL for immediate takedown review.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">10. Disclaimer of Warranties &amp; Limitation of Liability</h2>
                    <div className="p-4 rounded-xl bg-card border border-border space-y-3 text-caption text-foreground-secondary">
                        <p>
                            <strong>&quot;AS IS&quot; Basis:</strong> The Esparex Platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express, implied, statutory, or otherwise, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, non-infringement, or uninterrupted availability.
                        </p>
                        <p>
                            <strong>Limitation of Liability:</strong> To the maximum extent permitted under applicable Indian law, neither Esparex nor its founders, directors, employees, or agents shall be liable for any direct, indirect, incidental, special, consequential, or punitive damages (including loss of profits, data loss, device damage, or personal injury) arising out of or in connection with:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Your access to or inability to use the Platform;</li>
                            <li>Any transaction, exchange, payment, or interaction conducted between users;</li>
                            <li>The conduct, statements, or listings of any third-party user or technician;</li>
                            <li>Any defective, counterfeit, or malfunctioning electronics or spare parts purchased through third parties discovered on the Platform.</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">11. Indemnification</h2>
                    <p className="text-caption">
                        You agree to defend, indemnify, and hold harmless Esparex, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in any way connected with: (a) your access to or use of the Platform; (b) your violation of these Terms; (c) any content or listings you submit; or (d) your infringement of any third-party right or applicable Indian law.
                    </p>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">12. Governing Law &amp; Dispute Resolution</h2>
                    <p className="text-caption">
                        These Terms and any dispute or claim arising out of or related to your use of the Platform shall be governed by and construed in accordance with the <strong>laws of the Republic of India</strong>, without regard to its conflict of law principles. The competent <strong>courts situated in Hyderabad, Telangana, India</strong> shall have exclusive jurisdiction over any legal proceedings arising hereunder.
                    </p>
                </section>

                <section className="p-5 rounded-2xl bg-card border border-border shadow-xs">
                    <h2 className="text-h3 font-bold text-foreground mb-2">13. Grievance Redressal &amp; Nodal Contact</h2>
                    <p className="text-caption text-foreground-secondary mb-4">
                        For any complaints, report of rule violations, legal notices, or consumer grievances regarding the Platform, please contact our designated Grievance Officer:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-caption">
                        <div className="space-y-1">
                            <p className="font-bold text-foreground">{LEGAL_GRIEVANCE_OFFICER}</p>
                            <p className="text-foreground-secondary">{LEGAL_GRIEVANCE_DESIGNATION}</p>
                            <p className="text-foreground-secondary">{LEGAL_COMPANY_NAME}</p>
                            <p className="text-foreground-secondary">{LEGAL_COMPANY_LOCATION}</p>
                        </div>
                        <div className="space-y-1">
                            <p><strong>Grievance Email:</strong> <a href={`mailto:${LEGAL_GRIEVANCE_EMAIL}`} className="text-primary hover:underline">{LEGAL_GRIEVANCE_EMAIL}</a></p>
                            <p><strong>Support Email:</strong> <a href={`mailto:${LEGAL_SUPPORT_EMAIL}`} className="text-primary hover:underline">{LEGAL_SUPPORT_EMAIL}</a></p>
                            <p><strong>Phone Support:</strong> <a href={`tel:${LEGAL_SUPPORT_PHONE.replace(/\s+/g, '')}`} className="text-primary hover:underline">{LEGAL_SUPPORT_PHONE}</a></p>
                            <p className="text-foreground-subtle text-tiny mt-2">
                                ⏱️ <em>Grievances are acknowledged within 24 hours and addressed within 15 working days.</em>
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </InfoPage>
    );
}
