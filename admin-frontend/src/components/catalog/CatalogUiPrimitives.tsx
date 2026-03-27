"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { CheckCircle, Edit, Filter, Search, Trash2, XCircle } from "lucide-react";

export type SelectOption = {
    value: string;
    label: string;
};

type NamedEntityOption = {
    id?: string;
    name: string;
};

export function CatalogSearchInput({
    value,
    onChange,
    placeholder,
    className = "",
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
}) {
    return (
        <div className={`relative ${className}`.trim()}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
                type="text"
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

export function CatalogSelectFilter({
    value,
    onChange,
    options,
    withFilterIcon = false,
    className = "",
}: {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    withFilterIcon?: boolean;
    className?: string;
}) {
    return (
        <div className={`flex items-center gap-2 ${className}`.trim()}>
            {withFilterIcon ? <Filter className="text-slate-400" size={16} /> : null}
            <select
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export function CatalogCategoryFilter({
    categories,
    value,
    onChange,
    withFilterIcon = false,
    allLabel = "All Categories",
}: {
    categories: NamedEntityOption[];
    value: string;
    onChange: (value: string) => void;
    withFilterIcon?: boolean;
    allLabel?: string;
}) {
    return (
        <CatalogSelectFilter
            withFilterIcon={withFilterIcon}
            value={value}
            onChange={onChange}
            options={[
                { value: "all", label: allLabel },
                ...categories.flatMap((category) =>
                    category.id ? [{ value: category.id, label: category.name }] : []
                ),
            ]}
        />
    );
}

export function CatalogActiveStatusFilter({
    value,
    onChange,
    withFilterIcon = false,
}: {
    value: string;
    onChange: (value: string) => void;
    withFilterIcon?: boolean;
}) {
    return (
        <CatalogSelectFilter
            withFilterIcon={withFilterIcon}
            value={value}
            onChange={onChange}
            options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active Only" },
                { value: "inactive", label: "Inactive Only" },
            ]}
        />
    );
}

const toneClasses: Record<"success" | "danger" | "warning" | "neutral", string> = {
    success: "bg-emerald-100 text-emerald-700",
    danger: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    neutral: "bg-slate-100 text-slate-700",
};

export function CatalogStatusBadge({
    label,
    tone,
}: {
    label: string;
    tone: "success" | "danger" | "warning" | "neutral";
}) {
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${toneClasses[tone]}`}>
            {label}
        </span>
    );
}

export function CatalogActiveToggleButton({
    isActive,
    onClick,
    activeLabel = "Active",
    inactiveLabel = "Inactive",
}: {
    isActive: boolean;
    onClick: () => void;
    activeLabel?: string;
    inactiveLabel?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
        >
            {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {isActive ? activeLabel : inactiveLabel}
        </button>
    );
}

export function CatalogActionIconButton({
    onClick,
    icon,
    title,
    className,
}: {
    onClick: () => void;
    icon: ReactNode;
    title: string;
    className: string;
}) {
    return (
        <button type="button" onClick={onClick} className={className} title={title}>
            {icon}
        </button>
    );
}

export function CatalogActionsRow({ children }: { children: ReactNode }) {
    return <div className="flex items-center justify-end gap-2">{children}</div>;
}

export function CatalogEditDeleteActions({
    onEdit,
    onDelete,
    editTitle = "Edit",
    deleteTitle = "Delete",
}: {
    onEdit: () => void;
    onDelete: () => void;
    editTitle?: string;
    deleteTitle?: string;
}) {
    return (
        <CatalogActionsRow>
            <CatalogEditDeleteActionPair
                onEdit={onEdit}
                onDelete={onDelete}
                editTitle={editTitle}
                deleteTitle={deleteTitle}
            />
        </CatalogActionsRow>
    );
}

export function CatalogEditDeleteActionPair({
    onEdit,
    onDelete,
    editTitle = "Edit",
    deleteTitle = "Delete",
}: {
    onEdit: () => void;
    onDelete: () => void;
    editTitle?: string;
    deleteTitle?: string;
}) {
    return (
        <>
            <CatalogActionIconButton
                onClick={onEdit}
                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                title={editTitle}
                icon={<Edit size={18} />}
            />
            <CatalogActionIconButton
                onClick={onDelete}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title={deleteTitle}
                icon={<Trash2 size={18} />}
            />
        </>
    );
}

export function CatalogSearchAndCategoryFilters({
    searchValue,
    onSearchChange,
    searchPlaceholder,
    categories,
    categoryValue,
    onCategoryChange,
    withCategoryFilterIcon = false,
}: {
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder: string;
    categories: NamedEntityOption[];
    categoryValue: string;
    onCategoryChange: (value: string) => void;
    withCategoryFilterIcon?: boolean;
}) {
    return (
        <>
            <CatalogSearchInput
                value={searchValue}
                placeholder={searchPlaceholder}
                onChange={onSearchChange}
            />
            <CatalogCategoryFilter
                withFilterIcon={withCategoryFilterIcon}
                categories={categories}
                value={categoryValue}
                onChange={onCategoryChange}
            />
        </>
    );
}

export function CatalogBoundSearchCategoryFilters<TFilters extends { search: string; categoryId: string }>({
    filters,
    setFilters,
    searchPlaceholder,
    categories,
    withCategoryFilterIcon = false,
}: {
    filters: TFilters;
    setFilters: Dispatch<SetStateAction<TFilters>>;
    searchPlaceholder: string;
    categories: NamedEntityOption[];
    withCategoryFilterIcon?: boolean;
}) {
    return (
        <CatalogSearchAndCategoryFilters
            searchValue={filters.search}
            onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
            searchPlaceholder={searchPlaceholder}
            withCategoryFilterIcon={withCategoryFilterIcon}
            categories={categories}
            categoryValue={filters.categoryId}
            onCategoryChange={(categoryId) => setFilters((prev) => ({ ...prev, categoryId }))}
        />
    );
}

export function CatalogEntityCell({
    icon,
    iconClassName,
    title,
    subtitle,
}: {
    icon: ReactNode;
    iconClassName: string;
    title: ReactNode;
    subtitle?: ReactNode;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconClassName}`}>{icon}</div>
            <div>
                <div className="font-bold text-slate-900">{title}</div>
                {subtitle ? <div className="text-xs text-slate-500">{subtitle}</div> : null}
            </div>
        </div>
    );
}

export function CatalogTextInputField({
    label,
    value,
    onChange,
    placeholder,
    required = true,
    maxLength,
}: {
    label: ReactNode;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    required?: boolean;
    maxLength?: number;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
            <input
                required={required}
                type="text"
                maxLength={maxLength}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

export function CatalogCheckboxCard({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: ReactNode;
}) {
    return (
        <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-white hover:border-primary/50 transition-all">
            <input
                type="checkbox"
                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
            />
            <span className="text-sm font-semibold text-slate-700">{label}</span>
        </label>
    );
}

export function CatalogActiveCheckboxField({
    checked,
    onChange,
    label = "Active",
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: ReactNode;
}) {
    return <CatalogCheckboxCard checked={checked} onChange={onChange} label={label} />;
}

export function CatalogArchivedCategoryNotice({
    archivedCategoryCount,
    suffix,
}: {
    archivedCategoryCount: number;
    suffix?: ReactNode;
}) {
    if (archivedCategoryCount <= 0) return null;
    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {archivedCategoryCount} archived category link{archivedCategoryCount === 1 ? "" : "s"}{" "}
            {archivedCategoryCount === 1 ? "was" : "were"} removed from this editor.
            {suffix ? <> {suffix}</> : null}
        </div>
    );
}

import { Box, Briefcase, Smartphone, Wrench as WrenchIcon } from "lucide-react";

/**
 * Standardized icon getter for listing types.
 */
export function getListingTypeIcon(type: string, size = 16) {
    switch (type) {
        case "ad":
        case "postad":
            return <Smartphone size={size} />;
        case "service":
        case "postservice":
            return <Briefcase size={size} />;
        case "spare_part":
        case "postsparepart":
            return <WrenchIcon size={size} />;
        default:
            return <Box size={size} />;
    }
}

/**
 * Renders a list of category tags based on IDs and a lookup array.
 */
export function CatalogCategoryTags({
    categoryIds,
    categories,
    maxVisible = 3,
    validateId,
}: {
    categoryIds: string[];
    categories: NamedEntityOption[];
    maxVisible?: number;
    validateId?: (id: string) => boolean;
}) {
    if (!categoryIds || categoryIds.length === 0) {
        return <span className="text-[10px] text-red-500 font-medium italic">No Category</span>;
    }

    const visibleIds = categoryIds.slice(0, maxVisible);
    const hiddenCount = categoryIds.length - maxVisible;

    return (
        <div className="flex flex-wrap gap-1">
            {visibleIds.map((cid) => {
                const cat = categories.find((c) => c.id === cid);
                const isValid = validateId ? validateId(cid) : true;
                
                return (
                    <span
                        key={cid}
                        className={`px-2 py-0.5 rounded text-[10px] border whitespace-nowrap ${
                            isValid 
                                ? "bg-slate-100 text-slate-600 border-slate-200" 
                                : "bg-red-50 text-red-600 border-red-100 font-bold"
                        }`}
                        title={!isValid ? "This category link is invalid or inactive for this entity type." : ""}
                    >
                        {cat?.name || "Archived"}
                        {!isValid && " (!)"}
                    </span>
                );
            })}
            {hiddenCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-50 text-slate-400 border border-slate-100 whitespace-nowrap">
                    +{hiddenCount} more
                </span>
            )}
        </div>
    );
}

/**
 * Standardized select field for catalog forms.
 */
export function CatalogSelectField({
    label,
    value,
    onChange,
    options,
    required = false,
    placeholder = "Select an option",
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    required?: boolean;
    placeholder?: string;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
            <select
                required={required}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

/**
 * Renders a group of checkboxes for multi-select fields.
 */
export function CatalogCheckboxGroupField({
    label,
    options,
    selectedValues,
    onChange,
    columns = 1,
}: {
    label: string;
    options: { value: string; label: string }[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    columns?: 1 | 2;
}) {
    const handleToggle = (value: string) => {
        const nextValues = selectedValues.includes(value)
            ? selectedValues.filter((v) => v !== value)
            : [...selectedValues, value];
        onChange(nextValues);
    };

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
            <div className={`grid grid-cols-${columns} gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg`.trim()}>
                {options.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                            checked={selectedValues.includes(opt.value)}
                            onChange={() => handleToggle(opt.value)}
                        />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">
                            {opt.label}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}

/**
 * Renders standardized badges for listing types.
 */
export function CatalogListingTypeBadges({ types = [] }: { types?: string[] }) {
    if (!types || types.length === 0) return null;

    const config: Record<string, { label: string; color: string; icon: ReactNode }> = {
        ad: { label: "Devices", color: "blue", icon: <Smartphone size={10} /> },
        postad: { label: "Devices", color: "blue", icon: <Smartphone size={10} /> },
        service: { label: "Services", color: "purple", icon: <WrenchIcon size={10} /> },
        postservice: { label: "Services", color: "purple", icon: <WrenchIcon size={10} /> },
        spare_part: { label: "Spare Parts", color: "orange", icon: <Box size={10} /> },
        postsparepart: { label: "Spare Parts", color: "orange", icon: <Box size={10} /> },
    };

    return (
        <div className="flex flex-wrap gap-1.5">
            {types.map((type) => {
                const item = config[type];
                if (!item) return null;
                return (
                    <span
                        key={type}
                        className={`px-2 py-0.5 rounded text-[10px] bg-${item.color}-50 text-${item.color}-600 border border-${item.color}-100 font-bold flex items-center gap-1`}
                    >
                        {item.icon} {item.label}
                    </span>
                );
            })}
        </div>
    );
}


