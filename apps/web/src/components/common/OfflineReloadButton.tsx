"use client";

export function OfflineReloadButton() {
    return (
        <button
            onClick={() => window.location.reload()}
            className="mb-4 inline-flex h-11 items-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700 active:scale-95"
        >
            Try again
        </button>
    );
}
