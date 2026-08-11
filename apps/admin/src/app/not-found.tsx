import Link from 'next/link';

export const metadata = {
    title: '404 – Page Not Found | Esparex Admin',
};

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
                    <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center">
                        <span className="text-3xl">🔍</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-foreground-subtle mb-2">Error 404</p>
                    <h1 className="text-2xl font-bold text-foreground mb-3">Page Not Found</h1>
                    <p className="text-foreground-tertiary text-sm mb-8">
                        The admin page or resource you requested could not be found.
                    </p>

                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-6 py-3 rounded-xl shadow-xs transition-colors"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
