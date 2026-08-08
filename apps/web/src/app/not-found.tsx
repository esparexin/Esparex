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
        <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 w-full min-h-[calc(100dvh-14rem)] py-4 sm:py-8">
            {/* Mesh Gradient Background */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-slate-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000" />

            <div className="max-w-xl w-full relative z-10 transition-all duration-700">
                {/* Premium Compact Card */}
                <div className="bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.08)] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">

                    {/* Illustration Area */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-100 rounded-full scale-125 blur-xl opacity-50" />
                            <div className="h-20 w-20 bg-white rounded-2xl shadow-md flex items-center justify-center text-green-600 rotate-6 relative z-10 border border-slate-100">
                                <MapPinOff size={36} strokeWidth={1.5} />
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-green-600 rounded-xl shadow-md flex items-center justify-center text-white -rotate-6 z-20">
                                <Compass size={20} className="animate-spin" style={{ animationDuration: '8s' }} />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-tiny font-bold uppercase tracking-wider">
                            Error 404
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            Lost in the <span className="text-green-600">Marketplace?</span>
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                            Oops! It seems this item or page has been moved, sold, or taken off the shelf. Let{"'"}s get you back on track.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 mb-6">
                        <Link
                            href="/"
                            className="group flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl transition-all shadow-md shadow-green-200 active:scale-95 text-sm font-bold"
                        >
                            <Home size={18} />
                            <span>Go to Homepage</span>
                        </Link>
                        <Link
                            href="/search"
                            className="group flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-foreground-secondary px-5 py-3 rounded-xl transition-all border border-slate-200 shadow-sm active:scale-95 text-sm font-bold"
                        >
                            <Search size={18} className="text-green-600" />
                            <span>Search Marketplace</span>
                        </Link>
                    </div>

                    {/* Suggested Recovery List */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-5 border-t border-slate-100">
                        {[
                            { label: 'Safety Tips', href: '/safety-tips' },
                            { label: 'Post Ad', href: '/post-ad' },
                            { label: 'Support', href: '/contact' },
                            { label: 'Home Feed', href: '/' },
                        ].map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-foreground-subtle hover:text-green-600 text-xs sm:text-sm font-semibold transition-colors py-1"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

