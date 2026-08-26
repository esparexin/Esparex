import Link from "next/link";
import { Container, Button } from "@esparex/ui";
import { Sparkles, ArrowRight, PlusCircle, Search } from "@/icons/IconRegistry";

export function HomeBannerAd() {
    return (
        <section
            role="region"
            aria-label="Marketplace CTA"
            className="py-6 md:py-10"
        >
            <Container variant="lg">
                <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6 sm:p-8 md:p-10 shadow-xs">
                    {/* Ambient light accents matching brand green */}
                    <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
                    <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-primary/5 blur-2xl" aria-hidden="true" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-tiny font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
                                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Sell on Esparex</span>
                            </div>

                            <h2 className="text-headline sm:text-display-xs font-bold text-foreground tracking-tight leading-snug">
                                Reach thousands of buyers in your area
                            </h2>

                            <p className="mt-2 text-body text-foreground-secondary leading-relaxed">
                                List your spare parts, devices, or repair services — fast, 100% free to post, and easy to manage.
                            </p>
                        </div>

                        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="h-11 px-5 rounded-xl border-border bg-card hover:bg-muted text-foreground font-semibold text-caption gap-2 shadow-xs"
                            >
                                <Link href="/search">
                                    <Search className="h-4 w-4 text-foreground-secondary" aria-hidden="true" />
                                    <span>Browse Listings</span>
                                </Link>
                            </Button>

                            <Button
                                asChild
                                size="lg"
                                className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-caption gap-2 shadow-xs"
                            >
                                <Link href="/post-ad">
                                    <PlusCircle className="h-4 w-4" aria-hidden="true" />
                                    <span>Post for Free</span>
                                    <ArrowRight className="h-4 w-4 ml-0.5" aria-hidden="true" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}
