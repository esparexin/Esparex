import type { Metadata } from "next";
import { Geist } from "next/font/google";
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
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-primary',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  );
}

