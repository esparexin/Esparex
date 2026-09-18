import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AdminProviders } from "@/components/providers/AdminProviders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Esparex Admin",
  description: "Admin control plane for Esparex",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-primary',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  );
}

