import { InfoPage } from "@/components/common/InfoPage";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us | Esparex',
    description: 'Esparex is India\'s leading marketplace for electronics spare parts and repair services. We connect device owners with trusted technicians and suppliers.',
};



export default function AboutPage() {
    return (
        <InfoPage title="About Esparex">
            <div className="space-y-6 not-prose">
                <div>
                    <h2 className="text-base font-bold text-slate-800 mb-2">Who We Are</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Esparex is India&apos;s leading marketplace dedicated to electronics spare parts and repair services.
                        We bridge the gap between device owners, technicians, and spare part suppliers ensuring quality,
                        transparency, and trust in every transaction.
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <h2 className="text-base font-bold text-blue-800 mb-1">Our Mission</h2>
                    <p className="text-sm text-blue-700 leading-relaxed">
                        To extend the lifespan of electronics by making repair accessible, affordable, and reliable for everyone.
                    </p>
                </div>

                <div>
                    <h2 className="text-base font-bold text-slate-800 mb-3">Why Choose Us?</h2>
                    <div className="space-y-2.5">
                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                            <p className="text-sm text-slate-600 leading-relaxed"><span className="font-semibold text-slate-800">Verified Sellers:</span> We vet our business partners to ensure quality parts.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                            <p className="text-sm text-slate-600 leading-relaxed"><span className="font-semibold text-slate-800">Technician Network:</span> Find trusted repair experts in your locality.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="h-2 w-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                            <p className="text-sm text-slate-600 leading-relaxed"><span className="font-semibold text-slate-800">Transparent Pricing:</span> No hidden costs, direct deals between buyers and sellers.</p>
                        </div>
                    </div>
                </div>
            </div>
        </InfoPage>
    );
}
