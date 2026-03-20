
import { Button } from "./button";

export function MobileStickyCTA({
    label,
    onClick,
    disabled,
    loading
}: {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
}) {
    return (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-background border-t p-4 pb-safe md:hidden">
            <Button
                className="w-full shadow-lg"
                onClick={onClick}
                disabled={disabled || loading}
                size="lg" // Larger hit area for sticky bar
            >
                {loading ? "Loading..." : label}
            </Button>
        </div>
    );
}
