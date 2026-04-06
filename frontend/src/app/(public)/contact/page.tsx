import type { Metadata } from "next";
import { InfoPage } from "@/components/common/InfoPage";
import { Mail, MapPin, Phone } from "lucide-react";

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
            <p className="lead">
                We're here to help! Whether you have questions about a product, need support with an order,
                or want to partner with us, reach out.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-6 not-prose">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-wide">Email Support</p>
                        <p className="text-sm font-semibold text-blue-800 mt-0.5">support@esparex.com</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-100">
                    <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-green-400 uppercase tracking-wide">Phone</p>
                        <p className="text-sm font-semibold text-green-800 mt-0.5">+91 98765 43210</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-violet-50 border border-violet-100">
                    <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-violet-400 uppercase tracking-wide">Office</p>
                        <p className="text-sm font-semibold text-violet-800 mt-0.5">Hyderabad, Telangana</p>
                    </div>
                </div>
            </div>

            <h2>Business Inquiries</h2>
            <p>
                For partnership opportunities or bulk sales, please contact our business team at
                <a href="mailto:business@esparex.com"> business@esparex.com</a>.
            </p>
        </InfoPage>
    );
}
