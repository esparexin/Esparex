
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
export {
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
} from "lucide-react";

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
