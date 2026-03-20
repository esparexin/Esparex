import {
    Smartphone,
    Car,
    Home,
    Sofa,
    Laptop,
    Bike,
    Shirt,
    Gamepad2,
    Package,
    Store,
    Wrench,
    PawPrint,
    GraduationCap,
    Tablet,
    Camera,
    HardDrive,
    Watch,
    Monitor,
    LucideIcon
} from "lucide-react";

export interface CategoryVisual {
    icon: LucideIcon;
    color: string;
    bg: string;
}

export const DEFAULT_CATEGORY_VISUAL: CategoryVisual = {
    icon: Package,
    color: "text-slate-600",
    bg: "bg-slate-50"
};

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
    mobiles: { icon: Smartphone, color: "text-blue-600", bg: "bg-blue-50" },
    "mobile-phones": { icon: Smartphone, color: "text-blue-600", bg: "bg-blue-50" },
    smartphone: { icon: Smartphone, color: "text-blue-600", bg: "bg-blue-50" },

    vehicles: { icon: Car, color: "text-red-600", bg: "bg-red-50" },
    cars: { icon: Car, color: "text-red-600", bg: "bg-red-50" },
    car: { icon: Car, color: "text-red-600", bg: "bg-red-50" },

    property: { icon: Home, color: "text-indigo-600", bg: "bg-indigo-50" },
    properties: { icon: Home, color: "text-indigo-600", bg: "bg-indigo-50" },
    home: { icon: Home, color: "text-indigo-600", bg: "bg-indigo-50" },

    electronics: { icon: Laptop, color: "text-purple-600", bg: "bg-purple-50" },
    electronic: { icon: Laptop, color: "text-purple-600", bg: "bg-purple-50" },

    furniture: { icon: Sofa, color: "text-amber-600", bg: "bg-amber-50" },
    sofa: { icon: Sofa, color: "text-amber-600", bg: "bg-amber-50" },

    bikes: { icon: Bike, color: "text-cyan-600", bg: "bg-cyan-50" },
    bike: { icon: Bike, color: "text-cyan-600", bg: "bg-cyan-50" },
    motorcycles: { icon: Bike, color: "text-cyan-600", bg: "bg-cyan-50" },

    fashion: { icon: Shirt, color: "text-pink-600", bg: "bg-pink-50" },
    clothing: { icon: Shirt, color: "text-pink-600", bg: "bg-pink-50" },
    shirt: { icon: Shirt, color: "text-pink-600", bg: "bg-pink-50" },

    hobbies: { icon: Gamepad2, color: "text-emerald-600", bg: "bg-emerald-50" },
    gaming: { icon: Gamepad2, color: "text-emerald-600", bg: "bg-emerald-50" },
    consoles: { icon: Gamepad2, color: "text-emerald-600", bg: "bg-emerald-50" },
    gamepad: { icon: Gamepad2, color: "text-emerald-600", bg: "bg-emerald-50" },

    jobs: { icon: Store, color: "text-slate-600", bg: "bg-slate-50" },
    services: { icon: Wrench, color: "text-orange-600", bg: "bg-orange-50" },

    pets: { icon: PawPrint, color: "text-rose-600", bg: "bg-rose-50" },
    pet: { icon: PawPrint, color: "text-rose-600", bg: "bg-rose-50" },

    education: { icon: GraduationCap, color: "text-sky-600", bg: "bg-sky-50" },

    tablets: { icon: Tablet, color: "text-indigo-600", bg: "bg-indigo-50" },
    tablet: { icon: Tablet, color: "text-indigo-600", bg: "bg-indigo-50" },

    accessories: { icon: Watch, color: "text-teal-600", bg: "bg-teal-50" },
    watch: { icon: Watch, color: "text-teal-600", bg: "bg-teal-50" },
    smartwatch: { icon: Watch, color: "text-teal-600", bg: "bg-teal-50" },

    components: { icon: HardDrive, color: "text-slate-600", bg: "bg-slate-50" },
    cameras: { icon: Camera, color: "text-yellow-600", bg: "bg-yellow-50" },

    "spare-parts": { icon: Wrench, color: "text-orange-600", bg: "bg-orange-50" },
    laptops: { icon: Laptop, color: "text-blue-700", bg: "bg-blue-50" },
    laptop: { icon: Laptop, color: "text-blue-700", bg: "bg-blue-50" },

    "led-tv": { icon: Monitor, color: "text-red-700", bg: "bg-red-50" },
    "led-tvs": { icon: Monitor, color: "text-red-700", bg: "bg-red-50" },
    monitor: { icon: Monitor, color: "text-red-700", bg: "bg-red-50" },
};

export function getCategoryVisual(slugOrName?: string): CategoryVisual {
    const key = slugOrName?.toLowerCase();
    return CATEGORY_VISUALS[key || ""] || DEFAULT_CATEGORY_VISUAL;
}
