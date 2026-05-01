"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";

interface BackButtonProps {
    onClick?: () => void;
    label?: string;
    className?: string;
    variant?: "ghost" | "outline" | "default" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    showMobile?: boolean;
    showDesktop?: boolean;
    showLabelOnMobile?: boolean;
}

/**
 * Universal Back Button Component
 */
export function BackButton({
    onClick,
    label = "Back",
    className = "",
    variant = "ghost",
    size = "sm",
    showMobile = true,
    showDesktop = true,
    showLabelOnMobile = false,
}: BackButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            router.back();
        }
    };

    const mobileClass = showMobile ? "" : "hidden md:flex";
    const desktopClass = showDesktop ? "" : "md:hidden";
    const labelClass = showLabelOnMobile ? "" : "hidden sm:inline";

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            className={`gap-2 ${mobileClass} ${desktopClass} ${className}`}
        >
            <ArrowLeft className={size === "icon" ? "h-5 w-5" : "h-4 w-4"} />
            {size !== "icon" && <span className={labelClass}>{label}</span>}
        </Button>
    );
}
