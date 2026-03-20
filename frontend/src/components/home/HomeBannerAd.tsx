export function HomeBannerAd() {
    return (
        <section
            role="region"
            aria-label="Marketplace Banner"
            className="bg-slate-50 py-6 md:py-8"
        >
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Sponsored Slot
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">
                        Banner Ad Placement
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Reserved for future marketplace promotions.
                    </p>
                </div>
            </div>
        </section>
    );
}
