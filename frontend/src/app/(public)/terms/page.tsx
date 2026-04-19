import { InfoPage } from "@/components/common/InfoPage";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service | Esparex',
    description: 'Review the Terms of Service for using Esparex, the marketplace for electronics spare parts and repairs.',
    alternates: { canonical: 'https://esparex.in/terms' },
    openGraph: {
        title: 'Terms of Service | Esparex',
        description: 'Review the Terms of Service for using Esparex.',
        url: 'https://esparex.in/terms',
        images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
};



export default function TermsPage() {
    return (
        <InfoPage title="Terms of Service" lastUpdated={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}>
            <div className="space-y-8 text-muted-foreground leading-relaxed">
                <section>
                    <p>
                        Welcome to Esparex. These Terms of Service ("Terms") govern your access to and use of the Esparex marketplace, including our website, mobile applications, and associated services (collectively, the "Platform"). By creating an account or using the Platform, you agree to be bound by these Terms.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-foreground mb-3">1. Platform Nature</h3>
                    <p>
                        Esparex acts strictly as an online facilitator to connect buyers with independent sellers, businesses, and technicians. We are not a party to any transaction, contract, or agreement between you and any other user. We do not guarantee the existence, quality, safety, or legality of items advertised, nor the truth or accuracy of user content.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-foreground mb-3">2. User Accounts & Verification</h3>
                    <p className="mb-3">
                        To access certain features, you must register for an account using a valid mobile number and OTP. 
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>You are responsible for maintaining the confidentiality of your account access.</li>
                        <li><strong>Business Accounts:</strong> Users registering as a business must provide accurate government-issued documentation (e.g., GST Certificate, Shop Act). Providing false business credentials may result in an immediate permanent ban.</li>
                    </ul>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-foreground mb-3">3. Prohibited Content and Goods</h3>
                    <p className="mb-3">
                        As a user, you agree NOT to post, sell, or advertise any of the following:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Stolen devices or electronic components sourced from illegal activities.</li>
                        <li>Counterfeit goods falsely represented as OEM (Original Equipment Manufacturer) items.</li>
                        <li>Services that violate Indian cyber laws, such as IMEI spoofing or unlawful software modification.</li>
                        <li>Any content that is abusive, discriminatory, or intended to defraud fellow users.</li>
                    </ul>
                </section>
                
                <section>
                    <h3 className="text-xl font-bold text-foreground mb-3">4. Payments & Subscriptions</h3>
                    <p>
                        While basic ad posting is free, Esparex offers premium services (such as "Ads Spotlight" and "Business Storefronts"). All payments made for premium features on the Platform are non-refundable unless explicitly stated. Transactions made *between* buyers and sellers off-platform are strictly at your own risk.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-foreground mb-3">5. Disclaimer of Warranties & Limitation of Liability</h3>
                    <p>
                        The Esparex Platform is provided on an "AS IS" and "AS AVAILABLE" basis. We disclaim all warranties, express or implied, including the warranties of merchantability and fitness for a particular purpose. In no event shall Esparex, its directors, or employees be liable for any direct, indirect, incidental, or consequential damages resulting from a transaction conducted via our Platform.
                    </p>
                </section>
            </div>
        </InfoPage>
    );
}
