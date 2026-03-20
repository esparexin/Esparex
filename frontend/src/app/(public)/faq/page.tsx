import { InfoPage } from "@/components/common/InfoPage";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "FAQ | Esparex",
    description: "Find answers to common questions about buying, selling, and repairing electronics on Esparex.",
    alternates: {
        canonical: "https://esparex.com/faq",
    },
};

export default function FaqPage() {
    return (
        <InfoPage title="Help Center">
            <p className="mb-8">Frequently asked questions and support guides.</p>

            <div className="not-prose">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>How do I post an ad?</AccordionTrigger>
                        <AccordionContent>
                            To post an ad, click on the "Post Ad" button in the header. You'll need to login or create an account first. Follow the step-by-step process to list your item.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Is it free to sell on Esparex?</AccordionTrigger>
                        <AccordionContent>
                            Yes! Posting basic ads is free for individuals. Business accounts have premium plans available for higher visibility.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>How do verify my business?</AccordionTrigger>
                        <AccordionContent>
                            Go to your <Link href="/account/settings" className="underline">Account settings</Link> and click on "Register Business". You will need to upload valid proof of business (GST or Shop Establishment Act).
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </InfoPage>
    );
}
