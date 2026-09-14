import { ReactNode } from 'react';
import { Metadata } from 'next';
import { CommonLayout } from '@/components/layout/CommonLayout';

export const metadata: Metadata = {
    title: {
        template: '%s | Esparex',
        default: 'Esparex – Buy & Sell Electronics Smartly',
    },
    description: 'Buy and sell electronics, smartphones, laptops, tablets, and spare parts.',
};

export default function PublicLayout({ children }: { children: ReactNode }) {
    const currentYear = new Date().getUTCFullYear();

    return (
        <CommonLayout currentYear={currentYear}>
            {children}
        </CommonLayout>
    );
}
