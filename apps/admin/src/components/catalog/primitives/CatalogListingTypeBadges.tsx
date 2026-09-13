"use client";

import { Badge, Briefcase, Smartphone, Wrench as WrenchIcon } from "@esparex/ui";
import type { ReactNode } from "react";

const LISTING_TYPE = { AD: "ad", SERVICE: "service", SPARE_PART: "spare_part" };

export function CatalogListingTypeBadges({ types = [] }: { types?: Array<string | { type?: string; value?: string; id?: string }> }) {
    if (!types || !Array.isArray(types) || types.length === 0) return null;
    const config: Record<string, { label: string; className: string; icon: ReactNode }> = {
        [LISTING_TYPE.AD]: { label: "Devices", className: "bg-info/10 text-info border-info/20", icon: <Smartphone size={10} /> },
        [LISTING_TYPE.SERVICE]: { label: "Services", className: "bg-secondary text-secondary-foreground border-border", icon: <Briefcase size={10} /> },
        [LISTING_TYPE.SPARE_PART]: { label: "Spare Parts", className: "bg-warning/10 text-warning border-warning/20", icon: <WrenchIcon size={10} /> },
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
                    <Badge
                        key={`${typeStr || "type"}-${index}`}
                        variant="outline"
                        className={`text-tiny font-bold flex items-center gap-1 ${item.className}`}
                    >
                        {item.icon} {item.label}
                    </Badge>
                );
            })}
        </div>
    );
}
