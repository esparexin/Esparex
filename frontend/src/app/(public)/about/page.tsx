import { InfoPage } from "@/components/common/InfoPage";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us | Esparex',
    description: 'Esparex is India\'s leading marketplace for electronics spare parts and repair services. We connect device owners with trusted technicians and suppliers.',
};



export default function AboutPage() {
    return (
        <InfoPage title="About Esparex">
            <h2>Who We Are</h2>
            <p>
                Esparex is India's leading marketplace dedicated to electronics spare parts and repair services.
                We bridge the gap between device owners, technicians, and spare part suppliers ensuring quality,
                transparency, and trust in every transaction.
            </p>

            <h2>Our Mission</h2>
            <p>
                To extend the lifespan of electronics by making repair accessible, affordable, and reliable for everyone.
            </p>

            <h2>Why Choose Us?</h2>
            <ul>
                <li><strong>Verified Sellers:</strong> We vet our business partners to ensure quality parts.</li>
                <li><strong>Technician Network:</strong> Find trusted repair experts in your locality.</li>
                <li><strong>Transparent Pricing:</strong> No hidden costs, direct deals between buyers and sellers.</li>
            </ul>
        </InfoPage>
    );
}
