import { InfoPage } from "@/components/common/InfoPage";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Metadata } from "next";
import { toSafeJsonLd } from "@/lib/seo/jsonLd";
import { HelpCircle, ShieldCheck, Tag, ShoppingBag, Store, Wrench, ShieldAlert, CreditCard } from "@/icons/IconRegistry";
import { LEGAL_GRIEVANCE_EMAIL, LEGAL_SUPPORT_PHONE } from "@/lib/legal";

export const metadata: Metadata = {
    title: "Help Center & FAQ | Esparex",
    description: "Find instant answers to frequently asked questions about buying, selling, posting ads, verified business accounts, repair services, payments, and safety on Esparex.",
    alternates: { canonical: "https://esparex.in/faq" },
    openGraph: {
        title: "Help Center & FAQ | Esparex",
        description: "Find instant answers to frequently asked questions about buying, selling, posting ads, verified business accounts, repair services, payments, and safety on Esparex.",
        url: "https://esparex.in/faq",
        images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
};

interface FaqItem {
    id: string;
    question: string;
    answer: string;
}

interface FaqCategory {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    items: FaqItem[];
}

const FAQ_CATEGORIES: FaqCategory[] = [
    {
        id: "general-account",
        title: "Account & Registration",
        description: "Login, OTP authentication, profile settings, and data privacy",
        icon: HelpCircle,
        items: [
            {
                id: "ga-1",
                question: "How do I create an account or log in to Esparex?",
                answer: "Esparex uses passwordless authentication. Simply click 'Login' or 'Post Ad', enter your 10-digit Indian mobile number, and submit the 6-digit One-Time Password (OTP) sent to your phone via SMS. No passwords or email verifications are required for standard user accounts."
            },
            {
                id: "ga-2",
                question: "What should I do if I do not receive the OTP SMS?",
                answer: "First, verify that you entered a valid 10-digit mobile number. Wait 60 seconds for network latency and use the 'Resend OTP' button if needed. Ensure your mobile number is not in Do-Not-Disturb (DND) mode for transactional SMS. If issues persist, try again after 5 minutes or contact support."
            },
            {
                id: "ga-3",
                question: "Can I control who sees my mobile number?",
                answer: "Yes. In your Account Profile Settings, under 'Mobile Number Visibility', you can choose between 'Show' (visible to all buyers), 'Hide' (buyers can only communicate via Esparex in-app chat), or 'On-Request' (buyers must request your number via chat)."
            },
            {
                id: "ga-4",
                question: "How do I permanently delete my Esparex account?",
                answer: "You can permanently delete your account at any time by going to Account Settings > Delete Account. Type 'DELETE' to confirm. Upon submission, all your active listings and chat profiles are immediately removed from public view, and identifiable data is purged in accordance with our data retention schedule."
            },
            {
                id: "ga-5",
                question: "Can I use multiple accounts with the same phone number?",
                answer: "No. Each 10-digit Indian mobile number is mapped to exactly one unique Esparex user profile. Maintaining duplicate or fraudulent secondary accounts is prohibited under our platform terms."
            }
        ]
    },
    {
        id: "buying-safety",
        title: "Buying & Finding Spare Parts",
        description: "Searching inventory, checking device fitment, chatting with sellers, and safe meetups",
        icon: ShoppingBag,
        items: [
            {
                id: "bs-1",
                question: "How do I search for specific device parts or repair services?",
                answer: "Use the top search bar to type the exact device brand and model (e.g., 'iPhone 13 display' or 'Samsung S22 battery') or select a category from the navigation menu. You can apply filters for Brand, Model, Condition, Location (City/Radius), and Price Range to find exact matches in your locality."
            },
            {
                id: "bs-2",
                question: "What is the difference between OEM, Refurbished, and Compatible parts?",
                answer: "OEM (Original Equipment Manufacturer) parts are authentic original components manufactured by or for the device brand. Refurbished parts are pre-owned original parts restored to full working order. Compatible (Aftermarket) parts are third-party replacements that match specifications but are produced by independent accessory manufacturers. Sellers are mandated to disclose this condition explicitly in every listing."
            },
            {
                id: "bs-3",
                question: "How do I contact and negotiate with a seller?",
                answer: "Click the 'Chat with Seller' button on any active ad. This opens our secure, real-time messaging portal where you can negotiate pricing, ask technical questions, request additional photos, and agree on a public meetup location."
            },
            {
                id: "bs-4",
                question: "Can I pay sellers through Esparex escrow or delivery?",
                answer: "Esparex is currently an open, hyper-local discovery marketplace. Payment and handover occur directly between you and the seller. We strongly advise meeting in person at a public location or technician shop to test components prior to making payments via UPI or cash."
            },
            {
                id: "bs-5",
                question: "What precautions should I take when buying screens or motherboard parts?",
                answer: "Always inspect electronic items in person. For screens, bring testing tools or meet at a local technician's workshop to test touch sensitivity, dead pixels, and brightness before paying. Never transfer advance booking fees to unverified sellers."
            }
        ]
    },
    {
        id: "selling-ads",
        title: "Selling & Posting Ads",
        description: "Listing devices, photo requirements, pricing, editing, and ad lifecycle",
        icon: Tag,
        items: [
            {
                id: "sa-1",
                question: "Is it free to post ads for used electronics and spare parts?",
                answer: "Yes! Posting standard classified ads on Esparex is completely free. We also offer optional premium 'Spotlight' ad boosts for sellers seeking top search placement and maximum reach."
            },
            {
                id: "sa-2",
                question: "What are the rules for uploading photos to an ad?",
                answer: "You must upload between 1 and 5 clear, real photographs of the actual item being sold (JPEG/PNG/WebP format, maximum 5MB each). Stock renders, internet photos, watermarks with external contact numbers, and inappropriate images are automatically rejected by our visual moderation engine."
            },
            {
                id: "sa-3",
                question: "Why does my ad title or description get a validation error?",
                answer: "Titles must be between 10 and 80 characters long and accurately name the brand, model, or part. Descriptions must be between 20 and 500 characters. Phone numbers, external URL links, repetitive keyword stuffing, and profanity are strictly forbidden in titles and descriptions."
            },
            {
                id: "sa-4",
                question: "How do I edit or mark my ad as 'Sold'?",
                answer: "Navigate to Account > My Ads. Click 'Edit' on any active listing to update the price, photos, or description. Once an item has been sold, click 'Mark as Sold' to immediately hide it from public search results and prevent unnecessary inquiries."
            },
            {
                id: "sa-5",
                question: "How long does a posted ad remain active?",
                answer: "Standard ads remain active for 30 days. You will receive an automated notification before expiration, allowing you to renew or reactivate the listing with a single click if the item is still available."
            },
            {
                id: "sa-6",
                question: "Can I list multiple spare parts in a single ad?",
                answer: "For clarity and search accuracy, we recommend creating individual listings for distinct high-value items (such as a display or motherboard). For stripped donor boards or bulk small ICs, you may list them as a single lot while detailing the components in the description."
            }
        ]
    },
    {
        id: "business-b2b",
        title: "Verified Business & Storefronts",
        description: "B2B wholesale suppliers, GST verification, trust badges, and storefront features",
        icon: Store,
        items: [
            {
                id: "bb-1",
                question: "What is a 'Verified Business' account on Esparex?",
                answer: "A Verified Business account is designed for wholesalers, repair shop owners, and electronics retailers. Verified profiles receive an official green 'Verified Business' shield badge on all listings, a dedicated public storefront URL, and enhanced buyer trust."
            },
            {
                id: "bb-2",
                question: "What documents are required to get the Verified Business shield?",
                answer: "To register your business, go to Account > Register Business and provide your registered Business Name, GSTIN (Goods and Services Tax Number), Shop & Establishment Act license or trade certificate, and physical shop address. Our compliance team verifies documents within 24 to 48 hours."
            },
            {
                id: "bb-3",
                question: "Can I manage inventory across multiple repair branches?",
                answer: "Yes. Business users can specify their primary workshop address and secondary service coverage localities to ensure nearby buyers and repair seekers locate their nearest store."
            },
            {
                id: "bb-4",
                question: "What happens if a business account submits false GST or trade documents?",
                answer: "Esparex enforces zero tolerance for counterfeit or fraudulent business credentials. Any account submitting forged or third-party GST certificates will be permanently suspended, all active listings wiped, and details recorded for platform security."
            },
            {
                id: "bb-5",
                question: "How do wholesale buyers contact B2B sellers for bulk purchases?",
                answer: "Wholesale buyers can visit a business's public storefront page, view their full catalog, and initiate bulk chat inquiries directly to negotiate volume pricing."
            }
        ]
    },
    {
        id: "repair-services",
        title: "Repair Services & Technicians",
        description: "Listing technician services, on-site vs walk-in repairs, turnaround times, and reviews",
        icon: Wrench,
        items: [
            {
                id: "rs-1",
                question: "How do I list my electronic repair services as a technician?",
                answer: "Click 'Post Service' from the main menu. Select the service categories you specialize in (e.g., Screen Replacement, Battery Service, Motherboard Micro-soldering, Water Damage Diagnostics), specify your turnaround time, starting prices, and whether you offer on-site service or shop walk-in."
            },
            {
                id: "rs-2",
                question: "What is the difference between 'On-Site' and 'Shop Walk-In' services?",
                answer: "'Shop Walk-In' means customers bring devices directly to your physical workshop. 'On-Site' indicates that you or your technicians travel to the customer's home or office location to perform diagnosis and repairs."
            },
            {
                id: "rs-3",
                question: "How are repair service disputes or warranties handled?",
                answer: "Technicians are required to clearly state their warranty duration (e.g., 30-day screen touch warranty, 90-day battery warranty) in their listing description and written customer receipts. Disputes should be resolved amicably between the parties based on the advertised warranty terms."
            },
            {
                id: "rs-4",
                question: "Can customers leave reviews for repair services?",
                answer: "Yes. Customers who engage with technicians on Esparex can leave verified star ratings and feedback to help build long-term reputation and credibility across the local community."
            },
            {
                id: "rs-5",
                question: "Are unauthorized IMEI alteration or FRP bypass services permitted?",
                answer: "No. Esparex strictly prohibits any services that violate Indian cyber laws, including IMEI reprogramming, illegal unlocking of stolen devices, or unauthorized SIM duplication. Listings of this nature are immediately banned."
            }
        ]
    },
    {
        id: "moderation-rules",
        title: "Moderation, Approvals & Prohibited Items",
        description: "Ad screening, 'Held for Review' status, prohibited goods blacklist, and appeals",
        icon: ShieldAlert,
        items: [
            {
                id: "mr-1",
                question: "Why is my new ad showing 'Held for Review' or 'Pending'?",
                answer: "To protect buyers from scams and counterfeit goods, newly submitted or edited ads are scanned by our automated AI moderation system. If an ad contains high-value keywords, new image uploads, or price anomalies, it is queued for a brief manual check (typically completed within 15–60 minutes)."
            },
            {
                id: "mr-2",
                question: "What items and services are strictly prohibited on Esparex?",
                answer: "Prohibited items include: stolen devices/parts, counterfeit products falsely branded as OEM, devices with tampered IMEI numbers, iCloud/FRP bypass tools for stolen phones, hazardous damaged batteries, weapons, non-tech goods, adult content, and deceptive financial/loan schemes."
            },
            {
                id: "mr-3",
                question: "Why was my listing rejected?",
                answer: "Common reasons for ad rejection include: (1) Uploading stock/internet photos instead of real photos; (2) Including phone numbers or URLs in titles or images; (3) Prohibited or counterfeit products; (4) Deceptive pricing (e.g., ₹1 for a high-end smartphone); (5) Duplicate listing submissions."
            },
            {
                id: "mr-4",
                question: "How do I report a suspicious ad or scammer?",
                answer: "On any listing page or in a chat conversation, click the 'Report' flag icon. Select the appropriate reason (Spam, Scam, Prohibited Item, Offensive Content, Misleading Info, or Sold Elsewhere) and add details. Our Trust & Safety team reviews reports promptly."
            },
            {
                id: "mr-5",
                question: "How can I appeal a rejected ad or account suspension?",
                answer: "If you believe your listing was rejected in error, you can edit the ad to address the flagged issue or email our moderation support desk at support@esparex.in with your listing ID."
            }
        ]
    },
    {
        id: "payments-spotlight",
        title: "Spotlight Ads, Payments & Billing",
        description: "Promoting listings, spotlight visibility, accepted payment methods, and no-refund policy",
        icon: CreditCard,
        items: [
            {
                id: "ps-1",
                question: "What is an 'Ads Spotlight' promotion?",
                answer: "Spotlight is a paid promotional boost that pins your spare part or service listing to the top of category feeds, homepage highlights, and search result headers, increasing views by up to 5x."
            },
            {
                id: "ps-2",
                question: "What payment methods are supported for Spotlight promotions?",
                answer: "We support secure digital payments through authorized Indian payment gateways, including UPI (Google Pay, PhonePe, Paytm, BHIM), Net Banking, Debit Cards, and Credit Cards."
            },
            {
                id: "ps-3",
                question: "What is the Esparex Refund Policy for paid promotions and subscriptions?",
                answer: "Esparex maintains a strict No-Refund Policy. All payments made for Spotlight ads, listing promotions, boost credits, and business storefront subscriptions are non-refundable once activated or served on the platform. In the event of a verified duplicate technical charge, refunds will be reversed to the original payment method upon verification."
            },
            {
                id: "ps-4",
                question: "Can I get a GST tax invoice for business advertising expenses?",
                answer: "Yes. Business users with a registered GSTIN on file automatically receive a GST-compliant tax invoice for all paid Spotlight promotions and subscription renewals in their Account Dashboard."
            }
        ]
    },
    {
        id: "trust-safety",
        title: "Trust, Safety & Scam Prevention",
        description: "Safe transaction practices, fake UPI alerts, testing parts, and avoiding fraud",
        icon: ShieldCheck,
        items: [
            {
                id: "ts-1",
                question: "What is the #1 rule for avoiding scams on Esparex?",
                answer: "Never pay upfront to unverified individual sellers. Always meet in person at a public place or technician shop, physically inspect and test the device/part, and only then transfer payment."
            },
            {
                id: "ts-2",
                question: "How do fake UPI payment screenshot scams work, and how can sellers stay safe?",
                answer: "Fraudulent buyers sometimes generate fake UPI transfer screenshots using simulation apps. As a seller, NEVER hand over your item based on a screenshot shown by the buyer. Always verify that you have received the official transaction SMS or notification directly from your own bank app."
            },
            {
                id: "ts-3",
                question: "What should I do if a seller asks for a 'courier booking fee' or 'delivery deposit'?",
                answer: "Do not transfer money. Legitimate local sellers will arrange an in-person exchange. Demanding upfront courier deposits or customs clearance fees is a classic scam pattern. Report the user immediately."
            },
            {
                id: "ts-4",
                question: "Why should I keep all communications inside the Esparex chat?",
                answer: "Keeping conversations within the Esparex chat protects you. If a dispute or scam attempt occurs, our moderation and safety team can review the verified chat logs to take swift enforcement action or provide evidence to law enforcement."
            },
            {
                id: "ts-5",
                question: "Where can I report illegal activity or contact the Grievance Officer?",
                answer: `For critical safety concerns, cyber fraud, or statutory complaints, contact our Grievance Officer directly at ${LEGAL_GRIEVANCE_EMAIL} or call ${LEGAL_SUPPORT_PHONE}. All statutory grievances are acknowledged within 24 hours.`
            }
        ]
    }
];

// Flatten all items for structured data
const ALL_FAQS = FAQ_CATEGORIES.flatMap(cat => cat.items);

export default function FaqPage() {
    return (
        <InfoPage title="Help Center &amp; Frequently Asked Questions" containerVariant="md">
            {/* Schema.org FAQPage JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: toSafeJsonLd({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": ALL_FAQS.map(faq => ({
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

            <div className="flex flex-col gap-8 not-prose">
                <p className="text-foreground-secondary text-body leading-relaxed">
                    Everything you need to know about buying electronics spare parts, listing inventory, booking verified technicians, and staying safe on Esparex.
                </p>

                {/* Quick Category Navigation Pills */}
                <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-muted/40 border border-border">
                    <span className="text-tiny font-bold uppercase tracking-wider text-foreground-subtle self-center mr-1">Jump to:</span>
                    {FAQ_CATEGORIES.map(cat => (
                        <a
                            key={cat.id}
                            href={`#${cat.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-medium bg-card border border-border text-foreground-secondary hover:text-primary hover:border-primary/40 transition-colors shadow-2xs"
                        >
                            <cat.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>{cat.title}</span>
                        </a>
                    ))}
                </div>

                {/* FAQ Category Sections */}
                <div className="flex flex-col gap-8">
                    {FAQ_CATEGORIES.map(category => (
                        <section key={category.id} id={category.id} className="scroll-mt-20">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <category.icon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-h3 font-bold text-foreground">{category.title}</h2>
                                    <p className="text-caption text-foreground-secondary">{category.description}</p>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-2xl p-2 sm:p-4 shadow-xs">
                                <Accordion type="single" collapsible className="w-full">
                                    {category.items.map(faq => (
                                        <AccordionItem value={faq.id} key={faq.id} className="border-border">
                                            <AccordionTrigger className="text-left text-body font-semibold text-foreground py-3.5 hover:text-primary hover:no-underline">
                                                {faq.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-foreground-secondary leading-relaxed text-caption pb-4">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </section>
                    ))}
                </div>

                {/* Support Contact Box */}
                <div className="p-6 bg-card border border-border rounded-2xl text-center shadow-xs flex flex-col gap-3">
                    <h3 className="text-body-lg font-bold text-foreground">Still have questions?</h3>
                    <p className="text-caption text-foreground-secondary max-w-md mx-auto leading-relaxed">
                        Our customer support and trust &amp; safety team are ready to assist you with any platform inquiries or technical assistance.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg bg-primary text-primary-foreground font-semibold text-caption hover:bg-primary/90 transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
                        >
                            Contact Support Desk
                        </Link>
                        <Link
                            href="/safety-tips"
                            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg bg-muted text-foreground font-semibold text-caption hover:bg-muted/80 border border-border transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
                        >
                            Read Safety Guidelines
                        </Link>
                    </div>
                </div>
            </div>
        </InfoPage>
    );
}
