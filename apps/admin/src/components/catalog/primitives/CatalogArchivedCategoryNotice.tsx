"use client";

import type { ReactNode } from "react";

export function CatalogArchivedCategoryNotice({
    archivedCategoryCount, suffix,
}: {
    archivedCategoryCount: number; suffix?: ReactNode;
}) {
    if (archivedCategoryCount <= 0) return null;
    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {archivedCategoryCount} archived category link{archivedCategoryCount === 1 ? "" : "s"} was removed from this editor.
            {suffix ? <> {suffix}</> : null}
        </div>
    );
}
