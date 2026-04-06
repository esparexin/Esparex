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
        <InfoPage title="Privacy Policy" lastUpdated="December 29, 2025">
            <p>
                Your privacy is important to us. It is Esparex's policy to respect your privacy regarding any information
                we may collect from you across our website.
            </p>

            <h3>1. Information We Collect</h3>
            <p>
                We only ask for personal information when we truly need it to provide a service to you.
                We collect it by fair and lawful means, with your knowledge and consent.
            </p>

            <h3>2. How We Use Information</h3>
            <p>
                We use the information we collect to operate and maintain our website, send you marketing communications,
                respond to your comments and questions, and provide customer support.
            </p>

            <h3>3. Security</h3>
            <p>
                We value your trust in providing us your Personal Information, thus we are striving to use commercially
                acceptable means of protecting it.
            </p>
        </InfoPage>
    );
}
