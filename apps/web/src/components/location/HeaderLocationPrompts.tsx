"use client";


import { useLocationStatus, useLocationDispatch } from "@/context/LocationContext";
import LocationFirstVisitPrompt from "./LocationFirstVisitPrompt";
import LocationPermissionBlockedModal from "./LocationPermissionBlockedModal";

interface HeaderLocationPromptsProps {
    showLocationSelector: boolean;
    setShowLocationSelector: (show: boolean) => void;
    setShowSearchDropdown?: (show: boolean) => void;
    isMounted?: boolean;
    firstVisitBackdropClassName?: string;
    firstVisitWrapperClassName?: string;
    firstVisitPromptClassName?: string;
    style?: React.CSSProperties;
}

export function HeaderLocationPrompts({
    showLocationSelector,
    setShowLocationSelector,
    setShowSearchDropdown,
    isMounted = true,
    firstVisitBackdropClassName,
    firstVisitWrapperClassName,
    firstVisitPromptClassName,
    style,
}: HeaderLocationPromptsProps) {
    const { shouldShowFirstVisitPrompt, showPermissionBlockedModal } = useLocationStatus();
    const { detectLocation, dismissFirstVisitPrompt, dismissPermissionBlockedModal } = useLocationDispatch();

    return (
        <>
            {isMounted && shouldShowFirstVisitPrompt && !showLocationSelector && (
                <>
                    {firstVisitBackdropClassName ? (
                        <div className={firstVisitBackdropClassName} style={style} onClick={dismissFirstVisitPrompt} />
                    ) : null}
                    <div className={firstVisitWrapperClassName} style={style}>
                        <LocationFirstVisitPrompt
                            className={firstVisitPromptClassName}
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
                </>
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
