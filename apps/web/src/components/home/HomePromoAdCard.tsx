"use client";

import Link from "next/link";
import { Sparkles, PlusCircle, ArrowRight } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";

export function HomePromoAdCard({ className }: { className?: string }) {
    return (
        <article
            className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/10 via-card to-card text-card-foreground shadow-2xs duration-200 transition-all hover:border-primary/50 hover:shadow-xs hover:-translate-y-0.5",
                className
            )}
            aria-label="Sell on Esparex - Promotional Listing"
        >
            {/* Top Cover Section — exact same aspect-[4/3] as AdCardCover */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-emerald-500/10 p-3 sm:p-4 flex flex-col items-center justify-center text-center select-none">
                {/* Ambient glow accent */}
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/20 blur-xl" aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-emerald-500/15 blur-lg" aria-hidden="true" />

                {/* Badge */}
                <div className="relative z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-tiny font-bold bg-primary text-primary-foreground shadow-xs mb-2">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    <span>Sell on Esparex</span>
                </div>

                {/* Icon with subtle hover zoom */}
                <div className="relative z-10 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-card border border-primary/25 text-primary shadow-xs transition-transform duration-300 group-hover:scale-105">
                    <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                </div>

                <p className="relative z-10 mt-2 text-tiny font-semibold text-foreground-secondary line-clamp-1">
                    Reach 1,000s of buyers
                </p>
            </div>

            {/* Bottom Content Section — matches AdCardContent layout */}
            <div className="flex flex-col flex-1 justify-between p-3 sm:p-3.5 gap-2.5">
                <div>
                    <h3 className="text-caption sm:text-body font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        Post Your Ad for Free
                    </h3>
                    <p className="mt-0.5 text-tiny text-foreground-subtle line-clamp-2 leading-relaxed">
                        List spare parts, devices, or repair services in under 2 minutes.
                    </p>
                </div>

                <Link
                    href="/post-ad"
                    className="inline-flex items-center justify-center gap-1.5 w-full h-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-caption font-bold shadow-2xs transition-all active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <span>Post Free Ad</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
            </div>
        </article>
    );
}
