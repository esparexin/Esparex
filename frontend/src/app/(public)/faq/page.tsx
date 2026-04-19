import { InfoPage } from "@/components/common/InfoPage";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Metadata } from "next";
import { toSafeJsonLd } from "@/lib/seo/jsonLd";

export const metadata: Metadata = {
    title: "FAQ & Help Center | Esparex",
    description: "Got questions about buying, selling, or repairing electronics on Esparex? Find answers to our most frequently asked questions here.",
    alternates: { canonical: "https://esparex.in/faq" },
    openGraph: {
        title: "FAQ & Help Center | Esparex",
        description: "Find answers to common questions about buying, selling, and repairing electronics on Esparex.",
        url: "https://esparex.in/faq",
        images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
};

const faqData = [
    {
        question: "How does Esparex protect buyers?",
        answer: "Esparex actively verifies business sellers by verifying their KYC and GST documents. We recommend communicating through our built-in chat, inspecting items thoroughly during local meetups, and avoiding upfront payments to unverified sellers."
    },
    {
        question: "Is it free to sell on Esparex?",
        answer: "Yes! Posting basic ads for spare parts or used electronics is completely free. We also offer premium Spotlight features and verified Business Storefront plans for sellers who want maximum visibility."
    },
    {
        question: "How do I book a repair service?",
        answer: "Navigate to the 'Services' section on the homepage or search for your device model. You'll find verified technicians in your area. You can chat directly with them to negotiate pricing and arrange an on-site visit or a shop walk-in."
    },
    {
        question: "How do I upgrade to a Business Account?",
        answer: "Go to your Account Settings and click 'Register Business'. You will be asked to upload standard business documents (like GST or Shop Establishment Act). Once our moderation team approves it, your listings will feature a 'Verified Business' badge."
    },
    {
        question: "What is the difference between OEM and Compatible parts?",
        answer: "OEM (Original Equipment Manufacturer) parts are official parts made by the original brand. Compatible (or Aftermarket) parts are third-party replacements that are often cheaper but vary in quality. Esparex sellers are required to specify part authenticity in their listings."
    },
    {
        question: "Can I ship products to buyers?",
        answer: "Currently, Esparex specializes in hyper-local discovery. You and the buyer must arrange any shipping and payment individually. We strongly recommend local, in-person exchanges for the highest security."
    }
];

export default function FaqPage() {
    return (
        <InfoPage title="Help Center & FAQ">
             <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: toSafeJsonLd({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": faqData.map(faq => ({
                            "@type": "Question",
                            "name": faq.question,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": faq.answer
                            }
                        }))
                    }),
                }}
            />
            
            <p className="mb-8 text-muted-foreground text-lg">
                Find answers to common questions about navigating India's top electronics marketplace.
            </p>

            <div className="not-prose max-w-3xl">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-left text-base font-semibold">How do I post an ad?</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                            To post an ad, click on the <span className="font-semibold text-foreground">Post Ad</span> button in the top navigation bar. You'll need to log in or create an account via OTP first. Then, simply follow the step-by-step wizard to upload photos, select the category, and set your price.
                        </AccordionContent>
                    </AccordionItem>
                    
                    {faqData.map((faq, index) => (
                        <AccordionItem value={`faq-${index}`} key={index}>
                            <AccordionTrigger className="text-left text-base font-semibold">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                
                <div className="mt-12 p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                    <h3 className="text-lg font-bold text-foreground mb-2">Still need help?</h3>
                    <p className="text-sm text-muted-foreground mb-4">Our support team is always here to assist you with any platform issues.</p>
                    <Link href="/contact" className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
                        Contact Support
                    </Link>
                </div>
            </div>
        </InfoPage>
    );
}
