import { InfoPage } from "@/components/common/InfoPage";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | Esparex',
    description: 'Read our Privacy Policy to understand how Esparex collects, uses, and protects your personal information.',
    alternates: { canonical: 'https://esparex.in/privacy' },
    openGraph: {
        title: 'Privacy Policy | Esparex',
        description: 'Read our Privacy Policy to understand how Esparex collects, uses, and protects your personal information.',
        url: 'https://esparex.in/privacy',
        images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
};



export default function PrivacyPage() {
    return (
        <InfoPage title="Privacy Policy" lastUpdated={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}>
            <div className="space-y-8 text-muted-foreground leading-relaxed">
                <section>
                    <p>
                        Your privacy is critically important to us at Esparex. This Privacy Policy outlines how we collect, use, and protect your personal data when you use the Esparex marketplace (the "Platform"). By accessing our Platform, you consent to the data practices described in this policy.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-foreground mb-3">1. Information We Collect</h3>
                    <p className="mb-3">
                        We only collect information that is necessary to provide you with a secure and efficient marketplace experience:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Account Information:</strong> When you register, we collect your mobile number (via OTP verification) and profile details (name, email).</li>
                        <li><strong>Business Verification Data:</strong> For Business accounts, we collect KYC documents, GSTIN numbers, and Shop Establishment certificates required for trust and safety moderation.</li>
                        <li><strong>Listing Data:</strong> Any photos, descriptions, and location data you provide when posting an ad or service.</li>
                        <li><strong>Communication Data:</strong> Chat logs sent through the Esparex messaging system, retained strictly for fraud prevention and moderation purposes.</li>
                        <li><strong>Technical Data:</strong> Standard access logs, IP addresses, and device identifiers collected to prevent malicious activity.</li>
                    </ul>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-foreground mb-3">2. How We Use Information</h3>
                    <p className="mb-3">
                        The data we collect is utilized to operate and improve the Esparex ecosystem:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>To verify your identity and protect the community from fraudulent sellers.</li>
                        <li>To facilitate direct communication between buyers and sellers via our integrated chat layout.</li>
                        <li>To process payments for premium features like Ads Spotlight and Business Subscriptions (payments are processed securely via our partners, and we do not store raw credit card details).</li>
                        <li>To power hyper-local search results based on your specified location.</li>
                    </ul>
                </section>
                
                <section>
                    <h3 className="text-xl font-bold text-foreground mb-3">3. Data Sharing & Third Parties</h3>
                    <p className="mb-3">
                        Esparex does not sell your personal data to third-party advertisers. We strictly share data only when necessary:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>With other users:</strong> Your public profile name and location are visible to facilitate trades. Your phone number is only visible if you explicitly agree to share it on a listing.</li>
                        <li><strong>With Service Providers:</strong> We use AWS for secure image hosting and automated SMS/OTP providers to facilitate logins.</li>
                        <li><strong>Legal Compliance:</strong> We will disclose information if required by Indian law, a court order, or to protect the safety of our users.</li>
                    </ul>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-foreground mb-3">4. Content Moderation & Security</h3>
                    <p>
                        We value your trust. Our platform utilizes advanced moderation tools to scan listings and chat logs for illegal items, spam, and abusive language. While we strive to use commercially acceptable means to protect your Personal Information, remember that no method of transmission over the internet is 100% secure.
                    </p>
                </section>
                
                <section>
                    <h3 className="text-xl font-bold text-foreground mb-3">5. Data Deletion & Your Rights</h3>
                    <p>
                        You maintain the right to request the deletion of your account and personal data at any time through the Account Settings portal. Upon deletion, your active listings will be removed, and personal identifiable information wiped, barring any data we are legally required to retain for financial audits or fraud investigation.
                    </p>
                </section>
            </div>
        </InfoPage>
    );
}
