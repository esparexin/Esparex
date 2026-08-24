"use client";

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

    // Handle 1-click GPS auto-detection with immediate UI state sync
    const handleGpsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        // 1. Immediately blur input and clear local search query
        inputRef.current?.blur();
        setIsFocused(false);
        if (onQueryChange) onQueryChange("");
        if (onOpenChange) onOpenChange(false);

        // 2. Trigger auto-detection
        void detectLocation(true);
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

    );
}
