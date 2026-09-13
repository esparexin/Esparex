import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AdminProviders } from "@/components/providers/AdminProviders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Esparex Admin",
  description: "Admin control plane for Esparex",
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

