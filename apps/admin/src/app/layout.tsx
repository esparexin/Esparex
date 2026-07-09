import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "@/styles/globals.css";
import { AdminProviders } from "@/components/providers/AdminProviders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Esparex Admin",
  description: "Admin control plane for Esparex"
};

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-primary',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  );
}

