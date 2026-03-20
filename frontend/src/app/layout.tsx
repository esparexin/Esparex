import { ReactNode } from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { cookies } from 'next/headers';
import '../styles/globals.css';
import { RootClientShell } from '@/components/providers/RootClientShell';

const inter = localFont({
    src: [
        {
            path: '../../public/fonts/Inter-VariableFont_opsz,wght.ttf',
            style: 'normal',
        },
        {
            path: '../../public/fonts/Inter-Italic-VariableFont_opsz,wght.ttf',
            style: 'italic',
        },
    ],
    display: 'swap',
    preload: true,
});

export const metadata: Metadata = {
    manifest: '/manifest.json',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
    const cookieStore = await cookies();
    const initialHasAuthCookie = Boolean(cookieStore.get('esparex_auth'));

    return (
        <html lang="en">
            <body className={inter.className}>
                <RootClientShell initialHasAuthCookie={initialHasAuthCookie}>{children}</RootClientShell>
            </body>
        </html>
    );
}
