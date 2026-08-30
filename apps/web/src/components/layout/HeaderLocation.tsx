"use client";

import { useState, useRef } from "react";
import { ChevronDown, MapPin, Target, X } from "@/icons/IconRegistry";
import { Spinner } from "@esparex/ui";
import { useLocationData, useLocationDispatch, useLocationStatus } from "@/context/LocationContext";
import { getHeaderLocationText } from "@/lib/location/locationService";
import { useMounted } from "@/hooks/useMounted";
import { DEFAULT_APP_LOCATION } from "@/types/location";
import { cn } from "@/components/ui/utils";

interface HeaderLocationProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    query?: string;
    onQueryChange?: (val: string) => void;
    onClick?: () => void;
}

export function HeaderLocation({
    isOpen = false,
    onOpenChange,
    query = "",
    onQueryChange,
    onClick,
}: HeaderLocationProps) {
    const { location } = useLocationData();
    const { detectLocation } = useLocationDispatch();
    const { loading: isDetecting } = useLocationStatus();
    const mounted = useMounted();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const { headerText, tooltipText } = getHeaderLocationText(location);
    const resolvedHeaderText = mounted ? (headerText || DEFAULT_APP_LOCATION.display) : DEFAULT_APP_LOCATION.display;
    const isCustomLocation = mounted && location.source !== "default" && location.display !== DEFAULT_APP_LOCATION.display;
    const shouldShowX = isCustomLocation && !isOpen && !isFocused;

    // Handle 1-click GPS auto-detection or opening dropdown on X click
    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (shouldShowX) {
            // When X is clicked: focus input, clear local query, and open location dropdown
            inputRef.current?.focus();
            setIsFocused(true);
            if (onQueryChange) onQueryChange("");
            if (onOpenChange) onOpenChange(true);
            if (onClick) onClick();
        } else {
            // When Target (Auto-Detect) is clicked: trigger GPS auto-detection
            inputRef.current?.blur();
            setIsFocused(false);
            if (onQueryChange) onQueryChange("");
            if (onOpenChange) onOpenChange(false);
            void detectLocation(true);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        if (onOpenChange) onOpenChange(true);
        if (onClick) onClick();
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const handleContainerClick = () => {
        inputRef.current?.focus();
        if (onOpenChange) onOpenChange(true);
        if (onClick) onClick();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            setIsFocused(false);
            if (onQueryChange) onQueryChange("");
            if (onOpenChange) onOpenChange(false);
            inputRef.current?.blur();
        }
    };

    const displayValue = isFocused || (isOpen && query) ? query : resolvedHeaderText;

    return (
        <div
            onClick={handleContainerClick}
            className={cn(
                "flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 h-11 shadow-xs transition-all w-[220px] lg:w-[260px] cursor-text",
                isOpen
                    ? "border-primary ring-2 ring-primary/20 bg-background"
                    : "hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
            )}
            title={mounted ? (tooltipText || resolvedHeaderText) : DEFAULT_APP_LOCATION.display}
        >
            <MapPin className="h-4 w-4 text-primary shrink-0 transition-transform group-hover:scale-105" />

            <input
                ref={inputRef}
                type="text"
                value={displayValue}
                placeholder="Search city..."
                onChange={(e) => {
                    if (onQueryChange) onQueryChange(e.target.value);
                    if (!isOpen && onOpenChange) onOpenChange(true);
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="min-w-0 flex-1 bg-transparent border-0 p-0 text-body-lg md:text-body font-medium text-foreground placeholder:text-foreground-subtle focus:outline-none truncate cursor-text"
                aria-label="Location search and selection"
                aria-expanded={isOpen}
            />

            {/* GPS Auto-Detect / Clear Button inside the Header Field */}
            <button
                type="button"
                onClick={handleActionClick}
                disabled={isDetecting}
                title={shouldShowX ? "Change location" : "Detect current location using GPS"}
                aria-label={shouldShowX ? "Change location" : "Detect current location using GPS"}
                className="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors shrink-0 cursor-pointer p-0.5"
            >
                {isDetecting ? (
                    <Spinner size="sm" className="h-3.5 w-3.5 text-primary" />
                ) : shouldShowX ? (
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground shrink-0" />
                ) : (
                    <Target className="h-4 w-4 text-primary shrink-0" />
                )}
            </button>

            {/* Dropdown Chevron */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenChange) onOpenChange(!isOpen);
                }}
                aria-label={isOpen ? "Close location dropdown" : "Open location dropdown"}
                className="flex items-center justify-center h-6 w-4 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            >
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>
        </div>
    );
}
