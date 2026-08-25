import type { Metadata } from "next";
import { InfoPage } from "@/components/common/InfoPage";
import { Mail, MapPin, Phone } from "@/icons/IconRegistry";

export const metadata: Metadata = {
    title: "Contact Us | Esparex",
    description: "Get support, business inquiries, and contact details for Esparex.",
    alternates: { canonical: "https://esparex.in/contact" },
    openGraph: {
        title: "Contact Us | Esparex",
        description: "Get support, business inquiries, and contact details for Esparex.",
        url: "https://esparex.in/contact",
        images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
};

export default function ContactPage() {
    return (
        <InfoPage title="Contact Us">
            <p className="text-body text-foreground-secondary leading-relaxed mb-4">
                We&apos;re here to help! Whether you have questions about a product, need support with an order,
                or want to partner with us, reach out.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 not-prose">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-2xs font-bold text-foreground-subtle uppercase tracking-wider">Email Support</p>
                        <p className="text-caption font-semibold text-foreground mt-0.5">support@esparex.com</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Phone className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xs font-bold text-foreground-subtle uppercase tracking-wider">Phone</p>
                        <p className="text-caption font-semibold text-foreground mt-0.5">+91 98765 43210</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
                    <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                        <p className="text-2xs font-bold text-foreground-subtle uppercase tracking-wider">Office</p>
                        <p className="text-caption font-semibold text-foreground mt-0.5">Hyderabad, Telangana</p>
                    </div>
                </div>
            </div>

            <h2 className="text-h3 font-bold text-foreground mt-6 mb-2">Business Inquiries</h2>
            <p className="text-body text-foreground-secondary leading-relaxed">
                For partnership opportunities or bulk sales, please contact our business team at
                <a href="mailto:business@esparex.com" className="text-primary hover:underline ml-1">business@esparex.com</a>.
            </p>
        </InfoPage>
    );
}
