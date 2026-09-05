"use client";

import { Briefcase, Smartphone, Wrench as WrenchIcon } from "@esparex/ui";
import type { ReactNode } from "react";

const LISTING_TYPE = { AD: "ad", SERVICE: "service", SPARE_PART: "spare_part" };

export function CatalogListingTypeBadges({ types = [] }: { types?: Array<string | { type?: string; value?: string; id?: string }> }) {
    if (!types || !Array.isArray(types) || types.length === 0) return null;
    const config: Record<string, { label: string; className: string; icon: ReactNode }> = {
        [LISTING_TYPE.AD]: { label: "Devices", className: "bg-blue-50 text-blue-600 border-blue-100", icon: <Smartphone size={10} /> },
        [LISTING_TYPE.SERVICE]: { label: "Services", className: "bg-violet-50 text-violet-600 border-violet-100", icon: <Briefcase size={10} /> },
        [LISTING_TYPE.SPARE_PART]: { label: "Spare Parts", className: "bg-amber-50 text-amber-700 border-amber-100", icon: <WrenchIcon size={10} /> },
    };
    return (
        <div className="flex flex-wrap gap-1.5">
            {types.map((rawType, index) => {
                const typeStr = typeof rawType === "string"
                    ? rawType
                    : typeof rawType === "object" && rawType !== null
                        ? (rawType.type || rawType.value || rawType.id || "")
                        : String(rawType || "");
                const item = config[typeStr];
                if (!item) return null;
                return (
                    <span
                        key={`${typeStr || "type"}-${index}`}
                        className={`px-2 py-0.5 rounded text-tiny border font-bold flex items-center gap-1 ${item.className}`}
                    >
                        {item.icon} {item.label}
                    </span>
                );
            })}
        </div>
    );
}
