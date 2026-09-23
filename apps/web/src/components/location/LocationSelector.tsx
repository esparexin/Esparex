"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocationStatus, useLocationDispatch, useLocationData } from "@/context/LocationContext";
import type { Location } from "@/lib/api/user/locations";
import { normalizeLocationName } from "@/lib/location/locationService";
import {
    type SelectorVariant,
    getLocationPrimaryLabel,
    getLocationSecondaryLabel,
    toFinalSelectedLocation,
} from "./locationSelectorCore.helpers";
import { useLocationSearch } from "./useLocationSearch";

import { LocationResultsList, POPULAR_CITIES } from "./components/LocationResultsList";
import { LocationSelectorPanel } from "./components/LocationSelectorPanel";
import { LocationSelectorDropdown } from "./components/LocationSelectorDropdown";

type SnappedLocation = Location & { isSnapped?: boolean };

interface LocationSelectorProps {
    variant: SelectorVariant;
    mode?: "search" | "profile" | "postAd";
    onLocationSelect?: (loc: Location | null) => void;
    currentDisplay?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
    onClose?: () => void;
}

export default function LocationSelector({
    variant,
    mode = "search",
    onLocationSelect,
    currentDisplay,
    error,
    disabled,
    className,
    onClose,
}: LocationSelectorProps) {
    const isPanel = variant === "panel";
    const { detectError } = useLocationStatus();
    const { setManualLocation } = useLocationDispatch();
    const { location } = useLocationData();

    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [selectedLabel, setSelectedLabel] = useState(currentDisplay || "");
    const [hasSelection, setHasSelection] = useState(Boolean(currentDisplay));

    const inputRef = useRef<HTMLInputElement>(null);
    const manuallyClearedRef = useRef(false);

    const applySelection = useCallback((loc: Location, source: "manual" | "gps" = "manual") => {
        manuallyClearedRef.current = false;
        if (!isPanel) {
            const rawLabel = normalizeLocationName(loc.display || loc.name || loc.city);
            const prefix = (loc as SnappedLocation).isSnapped ? "~ " : "";
            setSelectedLabel(`${prefix}${rawLabel}`);
            setHasSelection(true);
            setIsOpen(false);
        }
        setQuery("");
        onLocationSelect?.(loc);

        if (mode === "postAd") return;

        const targetSource = source === "gps" ? "auto" : "manual";

        setManualLocation(
            loc.city || loc.name, loc.state, loc.name || loc.city,
            loc.locationId || loc.id, loc.coordinates,
            {
                country: loc.country, level: loc.level, persistProfile: mode === "profile",
                logSelectionAnalytics: mode === "search",
                source: targetSource,
            }
        );
    }, [isPanel, mode, onLocationSelect, setManualLocation]);

    const searchApi = useLocationSearch({ isOpen, isPanel, query, onApplySelection: applySelection, onClose });

    useEffect(() => {
        if (!detectError) return;
        void (async () => { searchApi.setDetectFeedback(detectError); })();
    }, [detectError, searchApi]);

    useEffect(() => {
        if (isPanel || manuallyClearedRef.current) return;

        void (async () => {
            if (currentDisplay) {
                setSelectedLabel(currentDisplay);
                setHasSelection(true);
            } else if (!currentDisplay && !isOpen && !query) {
                setSelectedLabel("");
                setHasSelection(false);
            }
        })();
    }, [currentDisplay, isOpen, isPanel, query]);

    useEffect(() => {
        const interactionOpen = isPanel || isOpen;
        if (!interactionOpen) return;
        void (async () => { setSelectedIndex(-1); })();
    }, [isOpen, isPanel, query]);

    const handleSelect = useCallback(async (loc: Location) => {
        searchApi.setIsSearching(true);
        try {
            const finalLoc = toFinalSelectedLocation(loc);
            applySelection(finalLoc, "manual");
            if (isPanel) {
                onClose?.();
            }
        } finally {
            searchApi.setIsSearching(false);
        }
    }, [applySelection, isPanel, onClose, searchApi]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const activeList = query.trim() ? searchApi.locations : POPULAR_CITIES;
        const isInteractionActive = isPanel || (isOpen && !hasSelection);
        if (!isInteractionActive || activeList.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) => (prev < activeList.length - 1 ? prev + 1 : prev));
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                break;
            case "Home":
                e.preventDefault();
                setSelectedIndex(0);
                break;
            case "End":
                e.preventDefault();
                setSelectedIndex(activeList.length - 1);
                break;
            case "Enter":
                if (selectedIndex >= 0 && activeList[selectedIndex]) {
                    e.preventDefault();
                    void handleSelect(activeList[selectedIndex]);
                }
                break;
            case "Escape":
                e.preventDefault();
                if (isPanel) {
                    onClose?.();
                } else {
                    setIsOpen(false);
                }
                break;
        }
    }, [handleSelect, isPanel, isOpen, hasSelection, onClose, query, searchApi.locations, selectedIndex]);

    const handleClear = useCallback(() => {
        manuallyClearedRef.current = true;
        setSelectedLabel("");
        setHasSelection(false);
        setQuery("");
        setIsOpen(true);
        searchApi.clearSearchSession();
        onLocationSelect?.(null);
        setTimeout(() => inputRef.current?.focus(), 50);
    }, [searchApi, onLocationSelect]);

    const handleSelectedFieldActivate = useCallback(() => {
        if (!hasSelection || disabled) return;
        handleClear();
    }, [hasSelection, disabled, handleClear]);

    const handleClearQuery = useCallback(() => setQuery(""), []);

    const handlePanelDetect = useCallback(() => { void searchApi.handleDetect(); }, [searchApi]);

    const renderResults = () => (
        <LocationResultsList
            query={query}
            showSkeleton={searchApi.showSkeleton}
            searchError={searchApi.searchError}
            retryCount={searchApi.retryCount}
            locations={searchApi.locations}
            isSearching={searchApi.isSearching}
            selectedIndex={selectedIndex}
            selectedCityName={location?.city || location?.name}
            onRetry={searchApi.handleRetry}
            onSelect={(loc) => void handleSelect(loc)}
            getLocationPrimaryLabel={getLocationPrimaryLabel}
            getLocationSecondaryLabel={getLocationSecondaryLabel}
        />
    );

    if (isPanel) {
        return (
            <LocationSelectorPanel
                className={className}
                onClose={onClose}
                isDetecting={searchApi.isDetecting}
                successFeedback={searchApi.successFeedback}
                detectFeedback={searchApi.detectFeedback}
                handlePanelDetect={handlePanelDetect}
                location={location}
                query={query}
                setQuery={setQuery}
                disabled={disabled}
                isSearching={searchApi.isSearching}
                handleClearQuery={handleClearQuery}
                onKeyDown={handleKeyDown}
            >
                {renderResults()}
            </LocationSelectorPanel>
        );
    }

    return (
        <LocationSelectorDropdown
            inputRef={inputRef}
            hasSelection={hasSelection}
            selectedLabel={selectedLabel}
            query={query}
            setQuery={setQuery}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            selectedIndex={selectedIndex}
            disabled={disabled}
            error={error}
            className={className}
            isSearching={searchApi.isSearching}
            isDetecting={searchApi.isDetecting}
            detectFeedback={searchApi.detectFeedback}
            handleClear={handleClear}
            handleSelectedFieldActivate={handleSelectedFieldActivate}
            handleKeyDown={handleKeyDown}
            onDetect={() => void searchApi.handleDetect(() => setIsOpen(false))}
        >
            {renderResults()}
        </LocationSelectorDropdown>
    );
}
