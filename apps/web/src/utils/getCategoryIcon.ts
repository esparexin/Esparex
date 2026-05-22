import type { LucideIcon } from "lucide-react";
import { IconRegistry } from "@/icons/IconRegistry";

/**
 * Robust utility to resolve category names, slugs, or icon keys to their canonical Lucide icons.
 * Normalizes input (trims, lowercases, collapses whitespace) and resolves aliases.
 */
export function getCategoryIcon(input?: string): LucideIcon {
    const defaultIcon = IconRegistry.Package as LucideIcon;
    
    if (!input) {
        return defaultIcon;
    }

    // Normalize: trim, collapse whitespace, and lowercase
    const normalized = input.trim().replace(/\s+/g, " ").toLowerCase();

    // 1. Check exact aliases
    if (normalized === "drone" || normalized === "drones") {
        return (IconRegistry.Drone as LucideIcon) || defaultIcon;
    }
    if (
        normalized === "led tv" ||
        normalized === "led tvs" ||
        normalized === "tv" ||
        normalized === "television" ||
        normalized === "monitor"
    ) {
        return (IconRegistry.Tv as LucideIcon) || defaultIcon;
    }
    if (normalized === "laptop" || normalized === "laptops") {
        return (IconRegistry.Laptop as LucideIcon) || defaultIcon;
    }
    if (
        normalized === "mobile" ||
        normalized === "mobiles" ||
        normalized === "phone" ||
        normalized === "smartphone"
    ) {
        return (IconRegistry.Smartphone as LucideIcon) || defaultIcon;
    }
    if (normalized === "tablet" || normalized === "tablets" || normalized === "ipad") {
        return (IconRegistry.Tablet as LucideIcon) || defaultIcon;
    }

    // 2. Case-insensitive lookup in the Registry keys
    const registryKeys = Object.keys(IconRegistry);
    const foundKey = registryKeys.find((key) => key.toLowerCase() === normalized);
    if (foundKey) {
        return (IconRegistry[foundKey] as LucideIcon) || defaultIcon;
    }

    // 3. Fallback
    return defaultIcon;
}
