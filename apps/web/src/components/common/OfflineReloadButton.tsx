"use client";

export function OfflineReloadButton() {
    return (
        <button
            onClick={() => window.location.reload()}
            className="mb-4 inline-flex h-11 items-center rounded-xl bg-primary hover:bg-primary/90 px-6 text-sm font-semibold text-primary-foreground transition active:scale-95 shadow-sm"
        >
            Try again
        </button>
    );
}
