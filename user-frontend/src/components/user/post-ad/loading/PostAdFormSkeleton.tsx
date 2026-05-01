"use client";

/**
 * ⏳ PostAdFormSkeleton
 * 
 * High-fidelity loading state for the Post Ad Form.
 * Mimics the layout of the single-page form with pulsing blocks.
 */
export function PostAdFormSkeleton() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 animate-in fade-in duration-300">
            {/* Header Skeleton */}
            <div className="mb-10 space-y-4">
                <div className="h-10 w-2/3 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-6 w-1/2 bg-slate-100 rounded-lg animate-pulse" />
            </div>

            {/* Form Container Skeleton */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8 md:p-12 space-y-16">
                {/* Section 1 Skeleton */}
                <div className="space-y-6">
                    <div className="h-6 w-1/4 bg-slate-200 rounded animate-pulse" />
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Section 2 Skeleton */}
                <div className="space-y-6">
                    <div className="h-6 w-1/4 bg-slate-200 rounded animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
                            <div className="h-12 w-full bg-slate-100 rounded-lg animate-pulse" />
                        </div>
                        <div className="space-y-3">
                            <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
                            <div className="h-12 w-full bg-slate-100 rounded-lg animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Section 3 Skeleton */}
                <div className="space-y-6">
                    <div className="h-6 w-1/4 bg-slate-200 rounded animate-pulse" />
                    <div className="h-32 w-full bg-slate-100 rounded-xl animate-pulse" />
                </div>
            </div>
        </div>
    );
}
