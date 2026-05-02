import type { Metadata } from "next";
import "@/styles/globals.css";
import { AdminProviders } from "@/components/providers/AdminProviders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Esparex Admin",
  description: "Admin control plane for Esparex"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  );
}
