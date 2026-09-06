import type { LucideIcon } from "@esparex/ui";
import {
    Package,
    Drone,
    Tv,
    Laptop,
    Smartphone,
    Tablet,
    Leaf,
    Contrast,
    Monitor,
    Cpu,
    HardDrive,
    Headphones,
    Speaker,
    Watch,
    Wrench,
    Tag,
    ShoppingCart,
    CreditCard,
    Building2,
    Store,
    Home,
    Search,
    User,
    Settings,
    Activity,
    FolderTree,
    Grid3x3,
    Zap,
    Flame,
    Sparkles,
    Palette,
} from "@esparex/ui";

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
    Drone,
    Smartphone,
    Tablet,
    Leaf,
    Contrast,
    Laptop,
    Monitor,
    Tv,
    Cpu,
    HardDrive,
    Headphones,
    Speaker,
    Watch,
    Wrench,
    Tag,
    Package,
    ShoppingCart,
    CreditCard,
    Building2,
    Store,
    Home,
    Search,
    User,
    Settings,
    Activity,
    FolderTree,
    Grid3x3,
    Zap,
    Flame,
    Sparkles,
    Palette,
};

/**
 * Robust utility to resolve category names, slugs, or icon keys to their canonical Lucide icons.
 * Normalizes input (trims, lowercases, collapses whitespace) and resolves aliases.
 */
export function getCategoryIcon(input?: string): LucideIcon {
    const defaultIcon = Package as LucideIcon;
    
    if (!input) {
        return defaultIcon;
    }

    // Normalize: trim, collapse whitespace, and lowercase
    const normalized = input.trim().replace(/\s+/g, " ").toLowerCase();

    // 1. Check exact aliases
    if (normalized === "drone" || normalized === "drones") {
        return Drone || defaultIcon;
    }
    if (
        normalized === "led tv" ||
        normalized === "led tvs" ||
        normalized === "tv" ||
        normalized === "television" ||
        normalized === "monitor"
    ) {
        return Tv || defaultIcon;
    }
    if (normalized === "laptop" || normalized === "laptops") {
        return Laptop || defaultIcon;
    }
    if (
        normalized === "mobile" ||
        normalized === "mobiles" ||
        normalized === "phone" ||
        normalized === "smartphone"
    ) {
        return Smartphone || defaultIcon;
    }
    if (normalized === "tablet" || normalized === "tablets" || normalized === "ipad") {
        return Tablet || defaultIcon;
    }

    // 2. Case-insensitive lookup in the Map keys
    const registryKeys = Object.keys(CATEGORY_ICON_MAP);
    const foundKey = registryKeys.find((key) => key.toLowerCase() === normalized);
    if (foundKey) {
        return CATEGORY_ICON_MAP[foundKey] || defaultIcon;
    }

    // 3. Fallback
    return defaultIcon;
}
