"use client";


import { useLocationState, useLocationDispatch } from "@/context/LocationContext";
import LocationFirstVisitPrompt from "./LocationFirstVisitPrompt";
import LocationPermissionBlockedModal from "./LocationPermissionBlockedModal";

interface HeaderLocationPromptsProps {
    showLocationSelector: boolean;
    setShowLocationSelector: (show: boolean) => void;
    setShowSearchDropdown?: (show: boolean) => void;
    isMounted?: boolean;
    firstVisitWrapperClassName?: string;
}

export function HeaderLocationPrompts({
    showLocationSelector,
    setShowLocationSelector,
    setShowSearchDropdown,
    isMounted = true,
    firstVisitWrapperClassName,
}: HeaderLocationPromptsProps) {
    const { shouldShowFirstVisitPrompt, showPermissionBlockedModal } = useLocationState();
    const { detectLocation, dismissFirstVisitPrompt, dismissPermissionBlockedModal } = useLocationDispatch();

    return (
        <>
            {isMounted && shouldShowFirstVisitPrompt && !showLocationSelector && (
                <div className={firstVisitWrapperClassName}>
                    <LocationFirstVisitPrompt
                        onUseCurrentLocation={() => {
                            void detectLocation(true, true).then((detected) => {
                                if (!detected) {
                                    setShowLocationSelector(true);
                                }
                            });
                        }}
                        onChooseManually={() => {
                            dismissFirstVisitPrompt();
                            setShowLocationSelector(true);
                            setShowSearchDropdown?.(false);
                        }}
                        onDismiss={dismissFirstVisitPrompt}
                    />
                </div>
            )}

            <LocationPermissionBlockedModal
                isOpen={showPermissionBlockedModal}
                onDismiss={dismissPermissionBlockedModal}
                onUseManualLocation={() => {
                    setShowLocationSelector(true);
                    setShowSearchDropdown?.(false);
                }}
                onOpenBrowserSettings={() => {
                    dismissPermissionBlockedModal();
                }}
            />
        </>
    );
}
