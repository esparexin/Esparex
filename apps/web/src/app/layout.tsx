import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { cookies } from 'next/headers';
import '../styles/globals.css';
import { RootClientShell } from '@/components/providers/RootClientShell';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-primary',
  display: 'swap',
});

const metadataBase = (() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (appUrl) {
        try {
            return new URL(appUrl);
        } catch {
            // Fall through to local default.
        }
    }

    return new URL('http://localhost:3000');
})();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
    metadataBase,
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
        <html lang="en" className={poppins.variable}>
            <body>
                <RootClientShell initialHasAuthCookie={initialHasAuthCookie}>{children}</RootClientShell>
            </body>
        </html>
    );
}
