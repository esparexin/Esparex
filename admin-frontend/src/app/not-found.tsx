import Link from 'next/link';

export const metadata = {
    title: '404 – Page Not Found | Esparex Admin',
};

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
                    <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <span className="text-3xl">🔍</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Error 404</p>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Page Not Found</h1>
                    <p className="text-gray-500 text-sm mb-8">
                        The admin page you&apos;re looking for doesn&apos;t exist or may have been moved.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
