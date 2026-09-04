import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import Script from 'next/script';
import { cookies } from 'next/headers';
import '../styles/globals.css';
import { RootClientShell } from '@/components/providers/RootClientShell';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-primary',
  display: 'swap',
});

const metadataBase = (() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (appUrl) {
        try {
            return new URL(appUrl);
        } catch {
            // Fall through to canonical default.
        }
    }

    return new URL('https://esparex.in');
})();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
    metadataBase,
    applicationName: 'Esparex',
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
        siteName: 'Esparex',
        type: 'website',
        locale: 'en_IN',
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
        site: '@esparexin',
        creator: '@esparexin',
        images: ['/og-image.png'],
    },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
    const cookieStore = await cookies();
    const initialHasAuthCookie = Boolean(cookieStore.get('esparex_auth'));
    const adSenseClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID?.trim();

    return (
        <html lang="en" className={geist.variable} suppressHydrationWarning>
            <body className="font-sans antialiased">
                <RootClientShell initialHasAuthCookie={initialHasAuthCookie}>{children}</RootClientShell>
                {adSenseClientId && (
                    <Script
                        async
                        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClientId}`}
                        strategy="afterInteractive"
                        crossOrigin="anonymous"
                    />
                )}
            </body>
        </html>
    );
}
