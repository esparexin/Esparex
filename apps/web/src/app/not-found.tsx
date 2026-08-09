import Link from 'next/link';
import { Home, Search, Compass, MapPinOff } from '@esparex/ui';


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
            <div className="absolute top-1/4 -left-4 w-56 sm:w-72 h-56 sm:h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none" />
            <div className="absolute top-1/4 -right-4 w-56 sm:w-72 h-56 sm:h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700 pointer-events-none" />

            <div className="max-w-md sm:max-w-lg w-full relative z-10">
                {/* Glassmorphic Compact Card */}
                <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_12px_24px_-6px_rgba(0,0,0,0.06)] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center">

                    {/* Compact Badge + Illustration */}
                    <div className="flex flex-col items-center gap-2 mb-3 sm:mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-100 rounded-full scale-110 blur-md opacity-60" />
                            <div className="h-14 w-14 sm:h-16 sm:w-16 bg-white rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-center text-green-600 rotate-3 relative z-10 border border-slate-100">
                                <MapPinOff size={28} strokeWidth={1.5} className="sm:hidden" />
                                <MapPinOff size={32} strokeWidth={1.5} className="hidden sm:block" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-7 w-7 sm:h-8 sm:w-8 bg-green-600 rounded-lg shadow-sm flex items-center justify-center text-white -rotate-6 z-20">
                                <Compass size={14} className="animate-spin sm:hidden" style={{ animationDuration: '8s' }} />
                                <Compass size={16} className="animate-spin hidden sm:block" style={{ animationDuration: '8s' }} />
                            </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200/60 text-green-700 text-2xs sm:text-tiny font-bold uppercase tracking-wider mt-1">
                            Error 404
                        </span>
                    </div>

                    {/* Compact Typography */}
                    <div className="space-y-1.5 sm:space-y-2">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                            Lost in the <span className="text-green-600">Marketplace?</span>
                        </h1>
                        <p className="text-muted-foreground text-xs sm:text-sm max-w-xs sm:max-w-sm mx-auto leading-relaxed">
                            Oops! It seems this item or page has been moved, sold, or taken off the shelf. Let{"'"}s get you back on track.
                        </p>
                    </div>

                    {/* Primary Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mt-4 sm:mt-5 mb-4">
                        <Link
                            href="/"
                            className="group flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white min-h-[42px] px-4 py-2.5 rounded-xl transition-all shadow-xs active:scale-[0.98] text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                        >
                            <Home size={16} />
                            <span>Go to Homepage</span>
                        </Link>
                        <Link
                            href="/search"
                            className="group flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-foreground-secondary min-h-[42px] px-4 py-2.5 rounded-xl transition-all border border-slate-200 shadow-2xs active:scale-[0.98] text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                        >
                            <Search size={16} className="text-green-600" />
                            <span>Search Marketplace</span>
                        </Link>
                    </div>

                    {/* Quick Navigation Links */}
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-3 border-t border-slate-100/80 text-xs text-muted-foreground">
                        <Link
                            href="/safety-tips"
                            className="hover:text-green-600 font-medium transition-colors py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 rounded"
                        >
                            Safety Tips
                        </Link>
                        <span className="text-slate-300 select-none">•</span>
                        <Link
                            href="/post-ad"
                            className="hover:text-green-600 font-medium transition-colors py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 rounded"
                        >
                            Post Ad
                        </Link>
                        <span className="text-slate-300 select-none">•</span>
                        <Link
                            href="/contact"
                            className="hover:text-green-600 font-medium transition-colors py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 rounded"
                        >
                            Support
                        </Link>
                        <span className="text-slate-300 select-none">•</span>
                        <Link
                            href="/"
                            className="hover:text-green-600 font-medium transition-colors py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 rounded"
                        >
                            Home Feed
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

