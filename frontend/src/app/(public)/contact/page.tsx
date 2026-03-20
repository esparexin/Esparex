import type { Metadata } from "next";
import { InfoPage } from "@/components/common/InfoPage";
import { Mail, MapPin, Phone } from "lucide-react";

export const metadata: Metadata = {
    title: "Contact Us | Esparex",
    description: "Get support, business inquiries, and contact details for Esparex.",
    alternates: {
        canonical: "https://esparex.com/contact",
    },
};

export default function ContactPage() {
    return (
        <InfoPage title="Contact Us">
            <p className="lead">
                We're here to help! Whether you have questions about a product, need support with an order,
                or want to partner with us, reach out.
            </p>

            <div className="grid md:grid-cols-3 gap-6 my-8 not-prose">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center text-center">
                    <Mail className="h-8 w-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-blue-900">Email Support</h3>
                    <p className="text-sm text-blue-700">support@esparex.com</p>
                </div>
                <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex flex-col items-center text-center">
                    <Phone className="h-8 w-8 text-green-600 mb-3" />
                    <h3 className="font-semibold text-green-900">Phone</h3>
                    <p className="text-sm text-green-700">+91 98765 43210</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 flex flex-col items-center text-center">
                    <MapPin className="h-8 w-8 text-purple-600 mb-3" />
                    <h3 className="font-semibold text-purple-900">Office</h3>
                    <p className="text-sm text-purple-700">Hyderabad, Telangana</p>
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
