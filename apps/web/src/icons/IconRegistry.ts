
import React from 'react';

/**
 * Central Icon Registry – ESPAREX
 *
 * WHY THIS FILE EXISTS:
 * - Single source of truth for ALL UI icons
 * - Prevents random icon imports across the codebase
 * - Enables tree-shaking and PWA optimization
 * - Makes future refactors safe and predictable
 *
 * RULE:
 * ❌ NEVER import icons directly from lucide-react anywhere else
 * ✅ ALWAYS import from "@/icons/IconRegistry"
 */

/* =======================
   Navigation & Common
======================= */
export {
    Home,
    Search,
    User,
    Phone,
    Mail,
    MapPin,
    Settings,

    Menu,
    ArrowLeft,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Plus,
    X,
} from "lucide-react";

/* =======================
   Actions & UI
======================= */
export {
    Edit2,
    Trash2,
    Share2,
    Eye,
    MoreVertical,
    Upload,
    UploadCloud,
    Filter,
    Heart,
    MessageCircle,
    VolumeX,
    EyeOff,
    Image,
    Download,
    FileText,
    Shield,
    ShieldOff,
    Lock,
    Unlock,
    Camera,
    LogOut,
    ChevronDown,
    ChevronUp,
    Maximize,
} from "lucide-react";

/* =======================
   Status & Feedback
======================= */
export {
    CheckCircle,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Clock,
    Loader2,
    Info,
    HelpCircle,
} from "lucide-react";

/* =======================
   Devices (Esparex Core)
======================= */
export {
    Drone,
    Smartphone,
    Tablet,
    Laptop,
    Monitor,
    Tv,
    Cpu,
    HardDrive,
    Headphones,
    Speaker,
    Watch
} from "lucide-react";

/* =======================
   Business & Commerce
======================= */
export {
    Building2,
    Store,
    Package,
    ShoppingCart,
    CreditCard,
    DollarSign,
    Tag,
    Wrench,
    Award,
    Star,
    Users,
} from "lucide-react";

/* =======================
   Social & Brand
======================= */
export const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("path", {
    d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
  }))
);

export const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("path", {
    d: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"
  }))
);

export const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  },
    React.createElement("rect", { width: 20, height: 20, x: 2, y: 2, rx: 5, ry: 5 }),
    React.createElement("path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" }),
    React.createElement("line", { x1: 17.5, x2: 17.51, y1: 6.5, y2: 6.5 })
  )
);

export const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  },
    React.createElement("path", { d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" }),
    React.createElement("rect", { width: 4, height: 12, x: 2, y: 9 }),
    React.createElement("circle", { cx: 4, cy: 4, r: 2 })
  )
);

/* =======================
   Admin & System
======================= */
export {
    TestTube2,
    ShoppingBag,
    Check,
    Calendar,
    CalendarClock,
    ShieldCheck,
    XCircle,
    RefreshCw,
    MoreHorizontal,
    RotateCcw,
    BarChart3,
    Activity,
    UserCheck,
    FileCheck,
    Send,
    ShieldAlert,
    MessageSquare,
    Flag,
    Edit,
    Ban,
    GripVertical,
    FolderTree,
    Grid3x3,
    File,
    Copy,
    Save,
    Database,
    Server,
    Zap,
    ArrowUp,
    ArrowDown,
    Radius,
    Ruler,
    Crosshair,
    FileCode,
    MailOpen,
    Sparkles,
    Palette,
    Key,
    Code,
    Brain,
    Power,
    PowerOff,
    Flame,
    FileJson,
    Link,
    ExternalLink,
    Bell,
    Map,
    Map as Globe,
    Navigation,
    List,
    Link2,
    LayoutDashboard,
    Settings2,
    Sliders,
    ToggleLeft,
    ToggleRight,
    MousePointer2,
    Briefcase,
    FileSpreadsheet,
    TrendingUp,
    Hash,
    CheckSquare,
    Folder,
    Radio,
    Images,
    History,
    Type,
    Bot,
    UserX,
    MessageSquareWarning,
    Target,
    TrendingDown,
    Hexagon,
    Circle,
    Layout,
    Megaphone,
    DraftingCompass,
    CircuitBoard,
    WifiOff,
    RefreshCcw
} from "lucide-react";

/* =======================
   Dynamic Registry
======================= */
import type { LucideIcon } from "lucide-react";
import {
    Drone as RegistryDrone,
    Smartphone as RegistrySmartphone,
    Tablet as RegistryTablet,
    Laptop as RegistryLaptop,
    Monitor as RegistryMonitor,
    Tv as RegistryTv,
    Cpu as RegistryCpu,
    HardDrive as RegistryHardDrive,
    Headphones as RegistryHeadphones,
    Speaker as RegistrySpeaker,
    Watch as RegistryWatch,
    Wrench as RegistryWrench,
    Tag as RegistryTag,
    Package as RegistryPackage,
    ShoppingCart as RegistryShoppingCart,
    CreditCard as RegistryCreditCard,
    Building2 as RegistryBuilding2,
    Store as RegistryStore,
    Home as RegistryHome,
    Search as RegistrySearch,
    User as RegistryUser,
    Settings as RegistrySettings,
    Activity as RegistryActivity,
    FolderTree as RegistryFolderTree,
    Grid3x3 as RegistryGrid3x3,
    Zap as RegistryZap,
    Flame as RegistryFlame,
    Sparkles as RegistrySparkles,
    Palette as RegistryPalette,
} from "lucide-react";

export const IconRegistry: Record<string, LucideIcon> = {
    Drone: RegistryDrone,
    Smartphone: RegistrySmartphone,
    Tablet: RegistryTablet,
    Laptop: RegistryLaptop,
    Monitor: RegistryMonitor,
    Tv: RegistryTv,
    Cpu: RegistryCpu,
    HardDrive: RegistryHardDrive,
    Headphones: RegistryHeadphones,
    Speaker: RegistrySpeaker,
    Watch: RegistryWatch,
    Wrench: RegistryWrench,
    Tag: RegistryTag,
    Package: RegistryPackage,
    ShoppingCart: RegistryShoppingCart,
    CreditCard: RegistryCreditCard,
    Building2: RegistryBuilding2,
    Store: RegistryStore,
    Home: RegistryHome,
    Search: RegistrySearch,
    User: RegistryUser,
    Settings: RegistrySettings,
    Activity: RegistryActivity,
    FolderTree: RegistryFolderTree,
    Grid3x3: RegistryGrid3x3,
    Zap: RegistryZap,
    Flame: RegistryFlame,
    Sparkles: RegistrySparkles,
    Palette: RegistryPalette,
};

export type IconName = keyof typeof IconRegistry;
