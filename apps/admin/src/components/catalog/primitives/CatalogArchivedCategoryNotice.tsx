"use client";

import type { ReactNode } from "react";

export function CatalogArchivedCategoryNotice({
    archivedCategoryCount, suffix,
}: {
    archivedCategoryCount: number; suffix?: ReactNode;
}) {
    if (archivedCategoryCount <= 0) return null;
    return (
        <div className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-body text-warning-dark">
            {archivedCategoryCount} archived category link{archivedCategoryCount === 1 ? "" : "s"} was removed from this editor.
            {suffix ? <> {suffix}</> : null}
        </div>
    );
}
