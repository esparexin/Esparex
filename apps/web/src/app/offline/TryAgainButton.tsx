"use client";

export default function TryAgainButton() {
    const handleRetry = () => {
        if (navigator.onLine) {
            window.location.reload();
        }
    };

    return (
        <button
            onClick={handleRetry}
            className="mb-4 inline-flex h-11 items-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700 active:scale-95"
        >
            Try again
        </button>
    );
}
