import Link from "next/link";

export function HomeBannerAd() {
    return (
        <section
            role="region"
            aria-label="Marketplace CTA"
            className="bg-white py-6 md:py-10"
        >
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-6 py-8 md:px-10 md:py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6 overflow-hidden relative">
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
                        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white" />
                        <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full bg-white" />
                    </div>

                    <div className="relative z-10">
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-2">
                            Sell on Esparex
                        </p>
                        <h3 className="text-xl md:text-2xl font-bold text-white leading-snug">
                            Reach thousands of buyers<br className="hidden md:block" /> in your area
                        </h3>
                        <p className="mt-2 text-sm text-blue-100 max-w-md">
                            List your spare parts, devices, or repair services — free to post and easy to manage.
                        </p>
                    </div>

                    <div className="relative z-10 flex flex-col sm:flex-row gap-3 flex-shrink-0">
                        <Link
                            href="/search"
                            className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition-colors"
                        >
                            Browse Listings
                        </Link>
                        <Link
                            href="/post-ad"
                            className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-sm font-bold transition-colors shadow-md"
                        >
                            Post for Free
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
