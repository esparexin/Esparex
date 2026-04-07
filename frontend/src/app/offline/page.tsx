import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "You're offline | Esparex",
    robots: { index: false, follow: false },
};

export default function OfflinePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <svg
                    className="h-10 w-10 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3l18 18M8.111 8.111A7.5 7.5 0 0119.5 12M4.929 4.929A13.5 13.5 0 0119.07 19.07M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-slate-800">You&apos;re offline</h1>
            <p className="mb-8 max-w-sm text-sm text-slate-500">
                It looks like you&apos;ve lost your internet connection. Check your network and try again.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="mb-4 inline-flex h-11 items-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700 active:scale-95"
            >
                Try again
            </button>
            <Link
                href="/"
                className="text-sm text-slate-500 underline-offset-2 hover:underline"
            >
                Go to homepage
            </Link>
        </div>
    );
}
