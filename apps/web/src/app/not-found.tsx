import Link from 'next/link';
import { Card, Button, Home, Search, Compass, MapPinOff } from '@esparex/ui';

export const metadata = {
    title: '404 - Page Not Found | Esparex',
    description: 'The page you are looking for does not exist on Esparex.',
};

/**
 * 404 Not Found Page Component.
 * Aligned with Esparex design system semantic theme tokens and standardized border radii.
 */
export default function NotFound() {
    return (
        <main
            id="not-found-main"
            className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 w-full min-h-[calc(100dvh-12rem)] py-3 sm:py-6"
        >
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 -left-4 w-56 sm:w-72 h-56 sm:h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none" />
            <div className="absolute top-1/4 -right-4 w-56 sm:w-72 h-56 sm:h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700 pointer-events-none" />

            <div className="max-w-md sm:max-w-lg w-full relative z-10">
                {/* Glassmorphic Status Card */}
                <Card className="bg-card/90 backdrop-blur-xl border border-border/80 shadow-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center">

                    {/* Compact Badge + Illustration */}
                    <div className="flex flex-col items-center gap-2 mb-3 sm:mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/10 rounded-full scale-110 blur-md opacity-60" />
                            <div className="h-14 w-14 sm:h-16 sm:w-16 bg-card rounded-xl sm:rounded-2xl shadow-xs flex items-center justify-center text-primary rotate-3 relative z-10 border border-border">
                                <MapPinOff size={28} strokeWidth={1.5} className="sm:hidden" />
                                <MapPinOff size={32} strokeWidth={1.5} className="hidden sm:block" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-7 w-7 sm:h-8 sm:w-8 bg-primary rounded-lg shadow-xs flex items-center justify-center text-primary-foreground -rotate-6 z-20">
                                {/* design-token-ignore: custom spin duration for decorative icon */}
                                <Compass size={14} className="animate-spin sm:hidden" style={{ animationDuration: '8s' }} />
                                {/* design-token-ignore: custom spin duration for decorative icon */}
                                <Compass size={16} className="animate-spin hidden sm:block" style={{ animationDuration: '8s' }} />
                            </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-tiny font-bold uppercase tracking-wider mt-1">
                            Error 404
                        </span>
                    </div>

                    {/* Compact Typography */}
                    <div className="space-y-1.5 sm:space-y-2">
                        <h1 className="text-h3 sm:text-h2 font-extrabold text-foreground tracking-tight">
                            Lost in the <span className="text-primary">Marketplace?</span>
                        </h1>
                        <p className="text-muted-foreground text-caption sm:text-body max-w-xs sm:max-w-sm mx-auto leading-relaxed">
                            Oops! It seems this item or page has been moved, sold, or taken off the shelf. Let{"'"}s get you back on track.
                        </p>
                    </div>

                    {/* Primary Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mt-4 sm:mt-5 mb-4">
                        <Button
                            asChild
                            variant="primary"
                            className="min-h-[44px] rounded-xl text-caption sm:text-body font-semibold"
                        >
                            <Link href="/">
                                <Home size={16} />
                                <span>Go to Homepage</span>
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="min-h-[44px] rounded-xl text-caption sm:text-body font-semibold"
                        >
                            <Link href="/search">
                                <Search size={16} className="text-primary" />
                                <span>Search Marketplace</span>
                            </Link>
                        </Button>
                    </div>

                    {/* Quick Navigation Links */}
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-3 border-t border-border/80 text-caption text-muted-foreground">
                        <Link
                            href="/safety-tips"
                            className="hover:text-primary font-medium transition-colors py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded"
                        >
                            Safety Tips
                        </Link>
                        <span className="text-muted select-none">•</span>
                        <Link
                            href="/post-ad"
                            className="hover:text-primary font-medium transition-colors py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded"
                        >
                            Post Ad
                        </Link>
                        <span className="text-muted select-none">•</span>
                        <Link
                            href="/contact"
                            className="hover:text-primary font-medium transition-colors py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded"
                        >
                            Support
                        </Link>
                        <span className="text-muted select-none">•</span>
                        <Link
                            href="/"
                            className="hover:text-primary font-medium transition-colors py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded"
                        >
                            Home Feed
                        </Link>
                    </div>
                </Card>
            </div>
        </main>
    );
}

