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
        <InfoPage title="Terms of Service" lastUpdated="December 29, 2025">
            <p>
                Welcome to Esparex. By accessing or using our website, you agree to be bound by these Terms of Service.
            </p>

            <h3>1. Acceptance of Terms</h3>
            <p>
                By accessing this website, you are agreeing to be bound by these website Terms and Conditions of Use,
                all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
            </p>

            <h3>2. Use License</h3>
            <p>
                Permission is granted to temporarily download one copy of the materials (information or software) on
                Esparex's website for personal, non-commercial transitory viewing only.
            </p>

            <h3>3. Disclaimer</h3>
            <p>
                The materials on Esparex's website are provided "as is". Esparex makes no warranties, expressed or implied,
                and hereby disclaims and negates all other warranties.
            </p>

            {/* Add more legal filler as needed or real content later */}
        </InfoPage>
    );
}
