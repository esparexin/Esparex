"use client";
interface HeaderLocationPromptsProps {
    showLocationSelector: boolean;
    setShowLocationSelector: (show: boolean) => void;
    setShowSearchDropdown?: (show: boolean) => void;
    isMounted?: boolean;
    firstVisitBackdropClassName?: string;
    firstVisitWrapperClassName?: string;
    firstVisitPromptClassName?: string;
    style?: React.CSSProperties;
    disableBlockedModal?: boolean;
}

export function HeaderLocationPrompts(_props: HeaderLocationPromptsProps) {
    // Legacy component: Modals have been removed in favor of native browser permission flow
    // and inline location search feedback.
    return null;
}
