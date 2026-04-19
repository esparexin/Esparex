import { InfoPage } from "@/components/common/InfoPage";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us | Esparex',
    description: 'Esparex is India\'s leading marketplace for electronics spare parts and repair services. We connect device owners with trusted technicians and suppliers.',
    alternates: { canonical: 'https://esparex.in/about' },
    openGraph: {
        title: 'About Us | Esparex',
        description: 'Esparex is India\'s leading marketplace for electronics spare parts and repair services.',
        url: 'https://esparex.in/about',
        images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
};



export default function AboutPage() {
    return (
        <InfoPage title="About Esparex">
            <div className="space-y-10 not-prose">
                <section>
                    <h2 className="text-xl font-bold text-foreground mb-4">India&apos;s Trusted Electronics Ecosystem</h2>
                    <p className="text-base text-muted-foreground leading-relaxed mb-4">
                        Esparex is India&apos;s premier dedicated marketplace for mobile spare parts, used devices, and professional repair services. Founded with the vision of creating a sustainable, transparent, and efficient circular economy for electronics, Esparex bridges the gap between everyday device owners, independent technicians, and wholesale suppliers.
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed">
                        Whether you are looking to buy an OEM display for your smartphone, sell a pre-owned laptop, or book a trusted local repair expert, Esparex provides a secure, verified platform to make it happen.
                    </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col justify-center">
                        <h3 className="text-lg font-bold text-blue-900 mb-2">Our Mission</h3>
                        <p className="text-sm text-blue-800/80 leading-relaxed">
                            To dramatically extend the lifespan of consumer electronics by making high-quality spare parts and reliable repair services accessible and affordable to everyone, in every corner of India.
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col justify-center">
                        <h3 className="text-lg font-bold text-emerald-900 mb-2">Our Vision</h3>
                        <p className="text-sm text-emerald-800/80 leading-relaxed">
                            To be the foundational infrastructure for the disorganized electronics repair sector, bringing standardized trust, verified inventory, and hyper-local connectivity to millions of businesses and consumers.
                        </p>
                    </div>
                </div>

                <section>
                    <h2 className="text-xl font-bold text-foreground mb-4">Why the Community Chooses Esparex</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-lg">1</span>
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-foreground">Verified B2B Storefronts</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed mt-1">We actively vet our business partners. Sellers with the "Verified Business" badge have submitted legitimate KYC, GST, or Shop Establishment Act documents, ensuring you receive authentic parts.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-lg">2</span>
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-foreground">A Comprehensive Catalog</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed mt-1">From rare IC chips and flex cables to fully refurbished iPhones and MacBooks, our strictly moderated catalog ensures finding exactly what you need without sifting through spam.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-lg">3</span>
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-foreground">Hyper-Local Services</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed mt-1">Don't want to repair it yourself? Use our Services portal to find highly-rated, local technicians who offer on-site repairs or shop walk-ins with transparent pricing.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-lg">4</span>
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-foreground">Direct & Transparent</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed mt-1">We believe in zero hidden commission fees between buyers and sellers. Our realtime chat enables direct negotiation, location sharing, and trust-building before any money changes hands.</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section className="pt-4">
                    <p className="text-sm text-muted-foreground italic text-center">
                        Join the fastest growing network of technicians, wholesalers, and electronics enthusiasts today.
                    </p>
                </section>
            </div>
        </InfoPage>
    );
}
