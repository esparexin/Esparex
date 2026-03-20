"use client";

import type { Location } from "@/api/user/locations";
import LocationSelectorCore from "./LocationSelectorCore";

interface LocationSelectorProps {
    variant?: "panel" | "inline";
    mode?: "search" | "profile" | "postAd";
    onClose?: () => void;
    onLocationSelect?: (loc: Location | null) => void;
    currentDisplay?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
}

export default function LocationSelector({
    variant = "panel",
    mode = "search",
    onClose,
    onLocationSelect,
    currentDisplay,
    error,
    disabled,
    className,
}: LocationSelectorProps) {
    return (
        <LocationSelectorCore
            variant={variant}
            mode={mode}
            onClose={onClose}
            currentDisplay={currentDisplay}
            error={error}
            disabled={disabled}
            className={className}
            onLocationSelect={(loc) => {
                onLocationSelect?.(loc);
            }}
        />
    );
}
