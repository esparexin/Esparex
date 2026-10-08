"use client";

import dynamic from "next/dynamic";
import type { InContentPlacementId } from "@esparex/contracts";

// Below-fold ad slot: code-split to reduce initial JS bundle.
// The hero_top slot (above fold) loads normally; this one hydrates after.
// Must be a Client Component because ssr:false is not allowed in Server Components.
const DynamicAdSlot = dynamic(
    () => import("@/components/common/AdPlacementSlot").then((mod) => mod.AdPlacementSlot),
    {
        ssr: false,
        loading: () => <div className="min-h-[250px]" aria-hidden="true" />,
    }
);

interface BelowFoldAdSlotProps {
    placement: InContentPlacementId;
}

export function BelowFoldAdSlot({ placement }: BelowFoldAdSlotProps) {
    return <DynamicAdSlot placement={placement} />;
}
