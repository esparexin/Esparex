import { InfoPage } from "@/components/common/InfoPage";
import { Metadata } from 'next';
import Link from "next/link";
import { LegalGrievanceCard } from "@/components/common/LegalGrievanceCard";
import {
    LEGAL_LAST_UPDATED,
    LEGAL_EFFECTIVE_DATE,
    LEGAL_COMPANY_NAME
} from "@/lib/legal";

export const metadata: Metadata = {
    title: 'Privacy Policy | Esparex',
    description: 'Understand how Esparex collects, uses, stores, protects, and deletes your personal and business data. Read our complete privacy practices, data retention schedule, and user rights.',
    alternates: { canonical: 'https://esparex.in/privacy' },
    openGraph: {
        title: 'Privacy Policy | Esparex',
        description: 'Read the official Esparex Privacy Policy for electronic spare parts and repair services marketplace.',
        url: 'https://esparex.in/privacy',
        images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
};

export default function PrivacyPage() {
    return (
        <InfoPage title="Privacy Policy" lastUpdated={LEGAL_LAST_UPDATED} containerVariant="md">
            <div className="flex flex-col gap-8 text-foreground-secondary text-body leading-relaxed">
                {/* Notice Badge / Quick Intro */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                    <p className="text-caption text-foreground-secondary leading-relaxed">
                        <strong>Effective Date:</strong> {LEGAL_EFFECTIVE_DATE} | <strong>Governing Framework:</strong> Information Technology Act, 2000, Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and the Digital Personal Data Protection Act, 2023 (DPDP Act).
                    </p>
                </div>

                <section>
                    <p>
                        Welcome to {LEGAL_COMPANY_NAME} (&quot;Esparex&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). Esparex is India&apos;s dedicated online marketplace connecting buyers, individual sellers, technicians, and verified wholesale suppliers of electronics, smartphone spare parts, and professional repair services.
                    </p>
                    <p className="mt-3">
                        This Privacy Policy describes in clear, transparent terms what personal information and data we collect, why we collect it, how it is processed and safeguarded, when it may be shared, how long it is retained, and how you can exercise your privacy and data protection rights under Indian law. By accessing or using our website (<Link href="/" className="text-primary hover:underline">esparex.in</Link>), mobile applications, or associated services (collectively, the &quot;Platform&quot;), you acknowledge that you have read and understood this Privacy Policy.
                    </p>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">1. Information We Collect</h2>
                    <p className="mb-3">
                        We collect only the minimum necessary information required to provide, secure, and improve the Esparex marketplace:
                    </p>
                    
                    <div className="flex flex-col gap-4">
                        <div className="p-4 rounded-xl bg-card border border-border">
                            <h3 className="text-body font-bold text-foreground mb-1">A. Account &amp; Identity Information</h3>
                            <ul className="list-disc pl-5 flex flex-col gap-1 text-caption text-foreground-secondary">
                                <li><strong>Mobile Phone Number:</strong> Used as your primary unique identifier for secure, passwordless OTP (One-Time Password) authentication.</li>
                                <li><strong>Profile Details:</strong> Your display name, optional email address, and profile photo or avatar.</li>
                                <li><strong>Account Preferences:</strong> Notification choices, mobile number visibility settings (show, hide, or on-request), and search filter preferences.</li>
                            </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-card border border-border">
                            <h3 className="text-body font-bold text-foreground mb-1">B. Business Verification &amp; KYC Documentation</h3>
                            <p className="text-caption text-foreground-secondary mb-2">
                                For sellers and technicians applying for a <strong>Verified Business Storefront</strong> badge, we collect statutory verification records:
                            </p>
                            <ul className="list-disc pl-5 flex flex-col gap-1 text-caption text-foreground-secondary">
                                <li>Registered business name, trade name, and business category (Retailer, Wholesaler, Repair Center).</li>
                                <li>Goods and Services Tax Identification Number (GSTIN).</li>
                                <li>Shop &amp; Establishment Act license or equivalent local trade certificates.</li>
                                <li>Physical shop/workshop address, business telephone, operating hours, and authorized contact person name.</li>
                            </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-card border border-border">
                            <h3 className="text-body font-bold text-foreground mb-1">C. Listing &amp; Catalog Content</h3>
                            <ul className="list-disc pl-5 flex flex-col gap-1 text-caption text-foreground-secondary">
                                <li>Product titles, descriptions, condition disclosures (Brand New, Refurbished, OEM Pull, Compatible/Aftermarket, For Parts).</li>
                                <li>Device brand, model hierarchy, spare part sub-types, pricing in INR, and warranty terms.</li>
                                <li>Photographs and media uploaded to showcase items or repair workshops.</li>
                                <li>Listing location metadata (City, State, Locality, and geo-coordinates for distance calculations).</li>
                            </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-card border border-border">
                            <h3 className="text-body font-bold text-foreground mb-1">D. Communications &amp; Safety Metadata</h3>
                            <ul className="list-disc pl-5 flex flex-col gap-1 text-caption text-foreground-secondary">
                                <li>In-app chat messages, offer exchanges, and interaction timestamps sent between buyers and sellers.</li>
                                <li>Community reports, dispute complaints, and feedback submitted regarding fraudulent listings or abusive behavior.</li>
                            </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-card border border-border">
                            <h3 className="text-body font-bold text-foreground mb-1">E. Technical, Device &amp; Security Data</h3>
                            <ul className="list-disc pl-5 flex flex-col gap-1 text-caption text-foreground-secondary">
                                <li>IP addresses, browser type and version, device model, operating system, and network carrier.</li>
                                <li>Access logs, API request telemetry, crash logs, and referral source URLs.</li>
                                <li>Approximate geographic location derived from IP or device GPS (when explicitly permitted for hyper-local search).</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">2. Legal Grounds for Processing Data</h2>
                    <p className="mb-3">
                        We process your personal information under the following lawful bases recognized by Indian law:
                    </p>
                    <ul className="list-disc pl-5 flex flex-col gap-2 text-caption">
                        <li><strong>Contractual Performance:</strong> To create your account, publish your listings, connect you with buyers/sellers, and facilitate communications.</li>
                        <li><strong>User Consent:</strong> For specific features such as precise geolocation, promotional notifications, and optional analytics cookies.</li>
                        <li><strong>Legal &amp; Statutory Compliance:</strong> To comply with mandatory requirements under the Information Technology Act 2000, Intermediary Guidelines 2021, GST laws, CERT-In cybersecurity directives, and lawful law-enforcement requests.</li>
                        <li><strong>Legitimate Interests:</strong> To detect fraud, block prohibited listings, enforce platform security, resolve disputes, and maintain a trusted marketplace ecosystem.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">3. How We Use Your Information</h2>
                    <p className="mb-2">
                        We use the information we collect for specific, legitimate marketplace purposes:
                    </p>
                    <ul className="list-disc pl-5 flex flex-col gap-1.5 text-caption">
                        <li>To authenticate your identity and protect user accounts against unauthorized takeovers.</li>
                        <li>To display relevant spare parts, devices, and repair technicians based on your city or search radius.</li>
                        <li>To facilitate real-time chat communication and price negotiation between prospective buyers and sellers.</li>
                        <li>To verify business authenticity through manual and automated KYC checks, awarding verified trust badges.</li>
                        <li>To perform automated AI-assisted scanning and human moderation of listings, photos, and messages to prevent counterfeit sales, scams, stolen goods, and abusive content.</li>
                        <li>To securely process payments for optional premium features (such as Spotlight Ads and Business Subscriptions). Payments are handled via authorized payment gateways; Esparex never stores raw credit/debit card numbers or bank PINs.</li>
                        <li>To send important transactional notifications, security alerts, and customer support responses.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">4. Information Sharing &amp; Third Parties</h2>
                    <div className="p-4 rounded-xl bg-card border border-border mb-4">
                        <p className="text-caption font-semibold text-foreground">
                            🔒 <strong>Our Zero-Sale Commitment:</strong> Esparex does NOT sell, rent, monetize, or trade your personal data, phone numbers, or email addresses to third-party marketing companies, brokers, or external advertising networks.
                        </p>
                    </div>
                    <p className="mb-3">We share data strictly in the following limited circumstances:</p>
                    <ul className="list-disc pl-5 flex flex-col gap-2 text-caption">
                        <li><strong>With Other Platform Users:</strong> Your display name, city/state, member since date, and active public listings are visible to facilitate trades. Your phone number is ONLY shared if you select the &quot;Show&quot; or &quot;On-Request&quot; visibility setting in your profile.</li>
                        <li><strong>With Infrastructure &amp; Cloud Partners:</strong> We utilize secure enterprise cloud infrastructure (e.g., AWS Asia Pacific data centers in India) for data storage, media hosting, and verified SMS/OTP delivery services. All service providers operate under strict confidentiality and security agreements.</li>
                        <li><strong>Statutory Authorities &amp; Law Enforcement:</strong> We disclose information when legally required by a valid court order, warrant, summons, or statutory directive from recognized law enforcement agencies under Indian law.</li>
                        <li><strong>Business Reorganization:</strong> In the event of a merger, acquisition, asset transfer, or corporate restructuring, user information will remain subject to the commitments outlined in this Privacy Policy.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">5. Data Retention Schedule</h2>
                    <p className="mb-3">
                        We retain personal data only for as long as necessary to fulfill marketplace operations, comply with statutory tax and accounting requirements, and resolve legal disputes:
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-caption border-collapse border border-border rounded-xl">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="p-3 font-semibold text-foreground">Data Category</th>
                                    <th className="p-3 font-semibold text-foreground">Retention Period</th>
                                    <th className="p-3 font-semibold text-foreground">Purpose &amp; Authority</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <tr>
                                    <td className="p-3 font-medium text-foreground">Active User Profiles</td>
                                    <td className="p-3">Duration of active account</td>
                                    <td className="p-3">Platform service delivery</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-medium text-foreground">Deleted Account Archives</td>
                                    <td className="p-3">Up to 180 days post-deletion</td>
                                    <td className="p-3">Fraud investigation, dispute defense &amp; audit trails</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-medium text-foreground">Invoicing &amp; Tax Records</td>
                                    <td className="p-3">8 years</td>
                                    <td className="p-3">Indian GST &amp; Income Tax statutory requirements</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-medium text-foreground">Business KYC Submissions</td>
                                    <td className="p-3">Active status + 5 years post-closure</td>
                                    <td className="p-3">Intermediary compliance &amp; merchant verification records</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-medium text-foreground">In-App Chat Logs</td>
                                    <td className="p-3">180 days to 1 year (auto-purged)</td>
                                    <td className="p-3">Abuse monitoring, spam detection &amp; dispute mediation</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-medium text-foreground">Technical &amp; Security Logs</td>
                                    <td className="p-3">180 days</td>
                                    <td className="p-3">CERT-In &amp; IT security compliance directives</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">6. Cookies &amp; Tracking Technologies</h2>
                    <p className="mb-2">
                        Esparex uses cookies and local storage tokens to deliver a reliable, secure user experience:
                    </p>
                    <ul className="list-disc pl-5 flex flex-col gap-1.5 text-caption">
                        <li><strong>Essential Cookies:</strong> Required for account authentication, CSRF security, maintaining your active session, and managing cookie consent preferences. These cannot be disabled.</li>
                        <li><strong>Functional Storage:</strong> Stores your local UI preferences, such as Dark/Light theme mode and last-searched city, directly in your browser.</li>
                        <li><strong>Anonymous Analytics:</strong> Aggregated, non-personally identifiable metrics (such as page view counts and ad impression frequencies) to optimize search performance.</li>
                    </ul>
                    <p className="text-caption mt-2">
                        You can manage or decline non-essential cookies via our on-screen Cookie Preferences banner or configure your browser settings to refuse cookies.
                    </p>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">7. Your Privacy Rights &amp; Data Deletion</h2>
                    <p className="mb-3">
                        Under the Digital Personal Data Protection Act, 2023, you have clear rights regarding your personal data:
                    </p>
                    <ul className="list-disc pl-5 flex flex-col gap-2 text-caption">
                        <li><strong>Right to Access &amp; Summary:</strong> You may view your profile, active listings, and account metadata at any time in Account Settings.</li>
                        <li><strong>Right to Rectification:</strong> You can edit your name, contact details, shop address, and listing information directly from your dashboard.</li>
                        <li><strong>Right to Erasure (Account Deletion):</strong> You can permanently delete your Esparex account and associated personal data by visiting <em>Account Settings &rarr; Delete Account</em>. Upon confirmation, active listings are removed immediately, and identifiable data is wiped according to our retention schedule.</li>
                        <li><strong>Right to Withdraw Consent:</strong> You may withdraw consent for optional communications or phone visibility at any time through your profile settings.</li>
                        <li><strong>Right to Nominate:</strong> You have the right to nominate an individual to manage your account in the event of incapacity or death.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">8. Security Safeguards</h2>
                    <p className="mb-2">
                        We implement multi-layered technical, administrative, and physical security measures to protect your data against unauthorized access, loss, or alteration:
                    </p>
                    <ul className="list-disc pl-5 flex flex-col gap-1 text-caption">
                        <li>All data in transit is encrypted using modern TLS (Transport Layer Security) 1.3 protocols with HTTPS enforcement.</li>
                        <li>Databases are hosted in secured VPC networks with strict role-based access control and principle of least privilege.</li>
                        <li>Automated visual and text classifiers continuously inspect uploads for malicious payloads, spam, and prohibited materials.</li>
                        <li>Periodic vulnerability assessments and dependency audits are conducted across our codebase.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">9. Children&apos;s &amp; Minors&apos; Usage Restriction</h2>
                    <p>
                        Esparex is intended solely for individuals who are <strong>18 years of age or older</strong> and legally capable of entering into binding contracts under the Indian Contract Act, 1872. We do not knowingly solicit or collect personal information from children or minors under 18. If we discover that an account has been created by a minor without verified parental/guardian authorization, we will promptly deactivate the account and delete the associated data.
                    </p>
                </section>

                <section>
                    <h2 className="text-h3 font-bold text-foreground mb-3">10. Policy Changes &amp; Version Updates</h2>
                    <p>
                        We may update this Privacy Policy periodically to reflect technological changes, new platform features, or evolving statutory requirements. When material changes occur, we will update the &quot;Last updated&quot; date at the top of this page and post a prominent notice on our website or send an in-app alert. We encourage you to review this policy periodically.
                    </p>
                </section>

                <section className="p-5 rounded-2xl bg-card border border-border shadow-xs">
                    <h2 className="text-h3 font-bold text-foreground mb-2">11. Grievance Redressal &amp; Nodal Contact</h2>
                    <p className="text-caption text-foreground-secondary mb-4">
                        In accordance with the Information Technology Act, 2000 and Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the designated Grievance Officer for Esparex is:
                    </p>

                    <LegalGrievanceCard />
                </section>
            </div>
        </InfoPage>
    );
}
