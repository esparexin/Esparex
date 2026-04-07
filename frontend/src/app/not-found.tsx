import Link from 'next/link';
import { Home, Search, ArrowLeft, Compass, MapPinOff } from 'lucide-react';

export const metadata = {
    title: '404 - Page Not Found | Esparex',
    description: 'The page you are looking for does not exist on Esparex.',
};

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center px-4">
            {/* Mesh Gradient Background */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-slate-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000" />

            <div className="max-w-3xl w-full relative z-10 transition-all duration-700">
                {/* Premium Card */}
                <div className="bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[40px] p-8 md:p-16 text-center">

                    {/* Illustration Area */}
                    <div className="flex justify-center mb-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-100 rounded-full scale-150 blur-2xl opacity-50" />
                            <div className="h-28 w-28 bg-white rounded-3xl shadow-xl flex items-center justify-center text-green-600 rotate-12 relative z-10">
                                <MapPinOff size={48} strokeWidth={1.5} />
                            </div>
                            <div className="absolute -bottom-4 -right-4 h-16 w-16 bg-green-600 rounded-2xl shadow-lg flex items-center justify-center text-white -rotate-12 z-20">
                                <Compass size={28} className="animate-spin" style={{ animationDuration: '8s' }} />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-bold uppercase tracking-widest mb-2">
                            Error 404
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                            Lost in the <span className="text-green-600">Marketplace?</span>
                        </h1>
                        <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
                            Oops! It seems this item or page has been moved, sold, or taken off the shelf. Let’s get you back on track.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 mb-12">
                        <Link
                            href="/"
                            className="group flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl transition-all shadow-lg shadow-green-200 active:scale-95 font-bold"
                        >
                            <Home size={20} />
                            <span>Go to Homepage</span>
                        </Link>
                        <Link
                            href="/search"
                            className="group flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-2xl transition-all border-2 border-slate-200 shadow-sm active:scale-95 font-bold"
                        >
                            <Search size={20} className="text-green-600" />
                            <span>Search Marketplace</span>
                        </Link>
                    </div>

                    {/* Suggested Recovery List */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-slate-100">
                        {[
                            { label: 'Safety Tips', href: '/safety-tips' },
                            { label: 'Post Ad', href: '/post-ad' },
                            { label: 'Support', href: '/contact' },
                            { label: 'Login', href: '/login' },
                        ].map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-slate-400 hover:text-green-600 text-sm font-semibold transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Footer Note */}
                <div className="mt-8 text-center text-slate-400">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 hover:text-slate-600 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} />
                        <span>Return to Main View</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
