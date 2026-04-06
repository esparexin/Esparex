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
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: '16x16 32x32', type: 'image/x-icon' },
            { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: [
            { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
    },
    openGraph: {
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Esparex — Buy & Sell Spare Parts',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        images: ['/og-image.png'],
    },
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
