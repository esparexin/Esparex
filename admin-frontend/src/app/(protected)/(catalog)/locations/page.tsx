"use client";

import {
    MapPin,
    MoreVertical,
    Trash2,
    TrendingUp,
} from "lucide-react";

import { useToast } from "@/context/ToastContext";
import { useAdminLocations } from "@/hooks/useAdminLocations";
import { type Location } from "@/types/location";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import {
    CatalogActionsRow,
    CatalogActiveStatusFilter,
    CatalogActionIconButton,
    CatalogActiveToggleButton,
    CatalogEntityCell,
    CatalogSearchInput,
    CatalogSelectFilter,
} from "@/components/catalog/CatalogUiPrimitives";

// Locations doesn't have a creation form currently in the system, 
// so we'll mock the form data just to satisfy the Template requirements.
type MockFormData = { dummy: boolean };

export default function LocationsPage() {
    const { showToast } = useToast();
    const {
        locations,
        states,
        loading,
        error,
        filters,
        setFilters,
        handleToggleStatus,
        handleTogglePopular,
        handleDelete,
        pagination,
        setPage,
    } = useAdminLocations();

    return (
        <CatalogPageTemplate<Location, MockFormData>
            title="Location Management"
            description="Manage system-wide master locations and geofences."
            createLabel="Add Location"
            csvFileName="locations.csv"
            items={locations}
            loading={loading}
            error={error}
            pagination={pagination}
            setPage={setPage}
            handleCreate={async () => { return false; }}
            handleUpdate={async () => { return false; }}
            defaultFormData={{ dummy: true }}
            onModalOpen={() => {
                showToast("Add Location feature coming soon", "info");
                // The open function internally calls setIsModalOpen(true),
                // but since there's no form, the user sees an empty modal or we can 
                // just block it. Actually, `onModalOpen` doesn't block opening.
                // We'll just leave it and the template will show an empty modal.
                // A better fix for read-only pages could be added to the template later.
            }}
            generateColumns={() => [
                {
                    header: "Location",
                    cell: (location) => (
                        <CatalogEntityCell
                            icon={<MapPin size={20} />}
                            iconClassName="rounded-full bg-blue-50 text-blue-600"
                            title={location.city}
                            subtitle={`${location.state}, ${location.country}`}
                        />
                    ),
                },
                {
                    header: "Level",
                    cell: (location) => (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                            {location.level}
                        </span>
                    ),
                },
                {
                    header: "Popular",
                    cell: (location) => (
                        <CatalogActiveToggleButton
                            isActive={location.isPopular}
                            onClick={() => void handleTogglePopular(location.id)}
                            activeLabel="Popular"
                            inactiveLabel="Regular"
                        />
                    ),
                },
                {
                    header: "Stats",
                    cell: (location) => (
                        <div className="text-xs space-y-0.5">
                            <div className="text-slate-600">
                                <span className="font-bold">{location.adsCount || 0}</span> Ads
                            </div>
                            <div className="text-slate-400">{location.usersCount || 0} Users</div>
                        </div>
                    ),
                },
                {
                    header: "Status",
                    cell: (location) => (
                        <CatalogActiveToggleButton
                            isActive={location.isActive}
                            onClick={() => void handleToggleStatus(location.id)}
                        />
                    ),
                },
                {
                    header: "Actions",
                    className: "text-right",
                    cell: (location) => (
                        <CatalogActionsRow>
                            <CatalogActionIconButton
                                onClick={() => void handleDelete(location.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                                icon={<Trash2 size={18} />}
                            />
                            <CatalogActionIconButton
                                onClick={() => {}}
                                className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
                                title="More"
                                icon={<MoreVertical size={18} />}
                            />
                        </CatalogActionsRow>
                    ),
                },
            ]}
            filterLayoutClassName="md:grid-cols-4"
            filtersRenderer={
                <>
                    <CatalogSearchInput
                        className="col-span-1 md:col-span-1"
                        value={filters.search ?? ""}
                        placeholder="Search city, state..."
                        onChange={(search) => setFilters((prev) => ({ ...prev, search }))}
                    />
                    <CatalogActiveStatusFilter
                        withFilterIcon
                        value={filters.status ?? "all"}
                        onChange={(status) => setFilters((prev) => ({ ...prev, status: status as any }))}
                    />
                    <CatalogSelectFilter
                        value={filters.state ?? "all"}
                        onChange={(state) => setFilters((prev) => ({ ...prev, state }))}
                        options={[
                            { value: "all", label: "All States" },
                            ...states.map((state) => ({ value: state, label: state })),
                        ]}
                    />
                    <CatalogSelectFilter
                        value={filters.level ?? "all"}
                        onChange={(level) => setFilters((prev) => ({ ...prev, level: level as any }))}
                        options={[
                            { value: "all", label: "All Levels" },
                            { value: "city", label: "City" },
                            { value: "state", label: "State" },
                        ]}
                    />
                </>
            }
            formRenderer={() => (
                <div className="p-4 text-center text-slate-500">
                    Location creation/editing features are coming soon.
                </div>
            )}
        />
    );
}
