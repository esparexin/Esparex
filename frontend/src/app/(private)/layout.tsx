import { ReactNode } from 'react';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { CommonLayout } from '@/components/layout/CommonLayout';

export const metadata: Metadata = {
    title: {
        template: '%s | Esparex',
        default: 'Esparex – Buy & Sell Electronics Smartly',
    },
    description: 'Buy and sell electronics, smartphones, laptops, tablets, and spare parts.',
    robots: { index: false, follow: false },
};

/**
 * Layout for authenticated (private) pages.
 * Auth guard is enforced by src/middleware.ts via isProtectedPath().
 * Route groups are transparent to the URL — paths remain unchanged.
 */
export default async function PrivateLayout({ children }: { children: ReactNode }) {
    const cookieStore = await cookies();
    const initialHasAuthCookie = Boolean(cookieStore.get('esparex_auth'));

    return (
        <CommonLayout initialHasAuthCookie={initialHasAuthCookie} suspenseHeader>
            {children}
        </CommonLayout>
    );
}
