import { ReactNode } from 'react';
import { Metadata } from 'next';
import { CommonLayout } from '@/components/layout/CommonLayout';

export const metadata: Metadata = {
    title: {
        template: '%s | Esparex',
        default: 'Esparex — India\'s Marketplace for Mobile Spare Parts & Tech Repair',
    },
    description: 'India\'s marketplace for genuine mobile spare parts, refurbished electronics, and repair services.',
};

export default function PublicLayout({ children }: { children: ReactNode }) {
    const currentYear = new Date().getUTCFullYear();

    return (
        <CommonLayout currentYear={currentYear}>
            {children}
        </CommonLayout>
    );
}
