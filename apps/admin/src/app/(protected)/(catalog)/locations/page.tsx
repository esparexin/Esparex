"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Edit, MapPin, Trash2 } from "lucide-react";
import { useAdminLocations } from "@/hooks/useAdminLocations";
import { useCatalogQueryStateSync } from "@/hooks/useCatalogQueryStateSync";
import { getLocationOptions } from "@/lib/api/locations";
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
import { adminLocationSchema } from "@/schemas/admin.schemas";
import { locationsTabs } from "@/components/layout/adminModuleTabSets";
import {
    normalizeSearchParamValue,
    parsePositiveIntParam,
} from "@/lib/urlSearchParams";
import {
    LocationFormFields,
    type LocationFormData,
} from "./components/LocationFormFields";
import { LocationDeleteModal } from "./components/LocationDeleteModal";

const LOCATION_STATUS_VALUES = new Set(["all", "active", "inactive"]);
const LOCATION_LEVEL_VALUES = new Set(["all", "state", "city", "area"]);

const normalizeStatusParam = (value: string | null) =>
    value && LOCATION_STATUS_VALUES.has(value) ? value : "all";

const normalizeLevelParam = (value: string | null) =>
    value && LOCATION_LEVEL_VALUES.has(value) ? value : "all";

type LocationsPageContentProps = {
    initialSearch: string;
    initialStatus: string;
    initialState: string;
    initialLevel: string;
    initialPage: number;
};

function LocationsPageContent({
    initialSearch,
    initialStatus,
    initialState,
    initialLevel,
    initialPage,
}: LocationsPageContentProps) {
    const [searchInput, setSearchInput] = useState(initialSearch);
    const [stateOptions, setStateOptions] = useState<Location[]>([]);
    const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filters = useMemo(
        () => ({
            search: initialSearch,
            status: initialStatus as "all" | "active" | "inactive",
            state: initialState || "all",
            level: initialLevel as "all" | "state" | "city" | "area",
        }),
        [initialLevel, initialSearch, initialState, initialStatus]
    );

    const {
        locations,
        states,
        loading,
        error,
        handleToggleStatus,
        handleDelete,
        handleCreate,
        handleUpdate,
        pagination,
    } = useAdminLocations({
        filters,
        page: initialPage,
        limit: 20,
    });

    const confirmDelete = async () => {
        if (!deletingLocation) return;
        setIsDeleting(true);
        const success = await handleDelete(deletingLocation.id);
        setIsDeleting(false);
        if (success) setDeletingLocation(null);
    };

    useEffect(() => {
        setSearchInput(initialSearch);
    }, [initialSearch]);

    const { replaceQueryState } = useCatalogQueryStateSync({
        searchInput,
        initialSearch,
        loading,
        initialPage,
        totalPages: pagination.totalPages,
    });

    useEffect(() => {
        let active = true;

        const loadStateOptions = async () => {
            const nextStates = await getLocationOptions({
                level: "state",
                status: "active",
                limit: 100,
            });

            if (active) {
                setStateOptions(nextStates);
            }
        };

        void loadStateOptions();

        return () => {
            active = false;
        };
    }, []);

    return (
        <>
            <CatalogPageTemplate<Location, LocationFormData>
                title="Location Management"
                description="Manage hierarchy-based master locations used by posting, reverse geocoding, and location analytics."
                tabs={locationsTabs}
                createLabel="Add Location"
                csvFileName="locations.csv"
                items={locations}
                loading={loading}
                error={error}
                pagination={pagination}
                setPage={(page) => replaceQueryState({ page: page > 1 ? page : null })}
                handleCreate={handleCreate}
                handleUpdate={handleUpdate}
                defaultFormData={{
                    name: "",
                    level: "city",
                    parentId: "",
                    parentStateId: "",
                    longitude: "",
                    latitude: "",
                    isActive: true,
                    country: "India",
                }}
                customSubmitValidation={(formData) => {
                    const validation = adminLocationSchema.safeParse({
                        name: formData.name,
                        level: formData.level,
                        parentId: formData.level === "state" ? null : formData.parentId,
                        longitude: formData.longitude,
                        latitude: formData.latitude,
                    });

                    if (!validation.success) {
                        return validation.error.issues[0]?.message || "Invalid form data";
                    }

                    if (formData.level === "area" && !formData.parentStateId) {
                        return "State is required for area creation";
                    }

                    return null;
                }}
                onModalOpen={(item, setFormData) => {
                    if (!item) return;

                    const level =
                        item.level === "state" || item.level === "city" || item.level === "area"
                            ? item.level
                            : "city";
                    const parentStateId =
                        level === "area"
                            ? item.path?.find((entry) => stateOptions.some((state) => state.id === entry)) ||
                              item.path?.[0] ||
                              ""
                            : "";

                    setFormData({
                        name: item.name,
                        level,
                        parentId: item.parentId || "",
                        parentStateId,
                        longitude: item.coordinates?.coordinates?.[0]?.toString() || "",
                        latitude: item.coordinates?.coordinates?.[1]?.toString() || "",
                        isActive: item.isActive,
                        country: item.country || "India",
                    });
                }}
                generateColumns={(openEditModal) => [
                    {
                        header: "Location",
                        cell: (location) => (
                            <CatalogEntityCell
                                icon={<MapPin size={20} />}
                                iconClassName="rounded-full bg-blue-50 text-blue-600"
                                title={location.name || location.city}
                                subtitle={`${location.state || "Unknown State"}, ${location.country}`}
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
                                    onClick={() => openEditModal(location)}
                                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                    title="Edit"
                                    icon={<Edit size={18} />}
                                />
                                <CatalogActionIconButton
                                    onClick={() => setDeletingLocation(location)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete"
                                    icon={<Trash2 size={18} />}
                                />
                            </CatalogActionsRow>
                        ),
                    },
                ]}
                filterLayoutClassName="md:grid-cols-5"
                filtersRenderer={
                    <>
                        <CatalogSearchInput
                            className="col-span-1 md:col-span-2"
                            value={searchInput}
                            placeholder="Search location name or slug..."
                            onChange={setSearchInput}
                        />
                        <CatalogActiveStatusFilter
                            withFilterIcon
                            value={filters.status ?? "all"}
                            onChange={(status) =>
                                replaceQueryState({ status: status === "all" ? null : status, page: null })
                            }
                        />
                        <CatalogSelectFilter
                            value={filters.state ?? "all"}
                            onChange={(state) =>
                                replaceQueryState({ state: state === "all" ? null : state, page: null })
                            }
                            options={[
                                { value: "all", label: "All States" },
                                ...states.map((state) => ({ value: state, label: state })),
                            ]}
                        />
                        <CatalogSelectFilter
                            value={filters.level ?? "all"}
                            onChange={(level) =>
                                replaceQueryState({ level: level === "all" ? null : level, page: null })
                            }
                            options={[
                                { value: "all", label: "All Levels" },
                                { value: "state", label: "State" },
                                { value: "city", label: "City" },
                                { value: "area", label: "Area" },
                            ]}
                        />
                    </>
                }
                formRenderer={(formData, setFormData) => (
                    <LocationFormFields
                        formData={formData}
                        setFormData={setFormData}
                        stateOptions={stateOptions}
                    />
                )}
            />

            <LocationDeleteModal
                deletingLocation={deletingLocation}
                isDeleting={isDeleting}
                onClose={() => setDeletingLocation(null)}
                onConfirm={() => void confirmDelete()}
            />
        </>
    );
}

export default function LocationsPage() {
    const searchParams = useSearchParams();

    const initialSearch = normalizeSearchParamValue(searchParams.get("q") ?? searchParams.get("search"));
    const initialStatus = normalizeStatusParam(searchParams.get("status"));
    const initialState = normalizeSearchParamValue(searchParams.get("state"));
    const initialLevel = normalizeLevelParam(searchParams.get("level"));
    const initialPage = parsePositiveIntParam(searchParams.get("page"), 1);

    return (
        <LocationsPageContent
            initialSearch={initialSearch}
            initialStatus={initialStatus}
            initialState={initialState}
            initialLevel={initialLevel}
            initialPage={initialPage}
        />
    );
}

