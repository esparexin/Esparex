"use client";

import { Edit, MapPin, MoreVertical, Trash2 } from "lucide-react";

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
    CatalogSelectField,
    CatalogTextInputField,
    CatalogCheckboxCard,
} from "@/components/catalog/CatalogUiPrimitives";

import { adminLocationSchema } from "@/schemas/admin.schemas";

import { locationsTabs } from "@/components/layout/adminModuleTabSets";

type LocationFormData = {
    name: string;
    level: "state" | "city" | "area";
    parentId: string;
    longitude: string;
    latitude: string;
    isActive: boolean;
    isPopular: boolean;
    country: string;
};

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
        handleCreate,
        handleUpdate,
        pagination,
        setPage,
    } = useAdminLocations();

    return (
        <CatalogPageTemplate<Location, LocationFormData>
            title="Location Management"
            description="Manage system-wide master locations and geofences."
            tabs={locationsTabs}
            createLabel="Add Location"
            csvFileName="locations.csv"
            items={locations}
            loading={loading}
            error={error}
            pagination={pagination}
            setPage={setPage}
            handleCreate={handleCreate}
            handleUpdate={handleUpdate}
            defaultFormData={{
                name: "",
                level: "city",
                parentId: "",
                longitude: "",
                latitude: "",
                isActive: true,
                isPopular: false,
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
                if (!validation.success) return validation.error.issues[0]?.message || "Invalid form data";
                return null;
            }}
            onModalOpen={(item, setFormData) => {
                if (item) {
                    setFormData({
                        name: item.name,
                        level: item.level as any,
                        parentId: item.parentId || "",
                        longitude: item.coordinates?.coordinates?.[0]?.toString() || "",
                        latitude: item.coordinates?.coordinates?.[1]?.toString() || "",
                        isActive: item.isActive,
                        isPopular: item.isPopular,
                        country: item.country || "India",
                    });
                }
            }}
            generateColumns={(openEditModal) => [
                {
                    header: "Location",
                    cell: (location) => (
                        <CatalogEntityCell
                            icon={<MapPin size={20} />}
                            iconClassName="rounded-full bg-blue-50 text-blue-600"
                            title={location.name || location.city}
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
                                onClick={() => openEditModal(location)}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                title="Edit"
                                icon={<Edit size={18} />}
                            />
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
                            { value: "area", label: "Area" },
                        ]}
                    />
                </>
            }
            formRenderer={(formData, setFormData) => (
                <div className="space-y-4">
                    <CatalogSelectField
                        label="Location Level"
                        value={formData.level}
                        onChange={(level) => setFormData((prev) => ({ ...prev, level: level as any }))}
                        options={[
                            { value: "state", label: "State" },
                            { value: "city", label: "City" },
                            { value: "area", label: "Area" },
                        ]}
                    />

                    <CatalogTextInputField
                        label="Name"
                        placeholder="e.g. Maharashtra or Mumbai"
                        value={formData.name}
                        onChange={(name) => setFormData((prev) => ({ ...prev, name }))}
                    />

                    {formData.level !== "state" && (
                        <CatalogTextInputField
                            label={formData.level === "city" ? "State ID (Parent)" : "City ID (Parent)"}
                            placeholder="Enter MongoDB ObjectID of parent"
                            value={formData.parentId}
                            onChange={(parentId) => setFormData((prev) => ({ ...prev, parentId }))}
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <CatalogTextInputField
                            label="Longitude"
                            placeholder="e.g. 72.8777"
                            value={formData.longitude}
                            onChange={(longitude) => setFormData((prev) => ({ ...prev, longitude }))}
                        />
                        <CatalogTextInputField
                            label="Latitude"
                            placeholder="e.g. 19.0760"
                            value={formData.latitude}
                            onChange={(latitude) => setFormData((prev) => ({ ...prev, latitude }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <CatalogCheckboxCard
                            checked={formData.isActive}
                            onChange={(isActive) => setFormData((prev) => ({ ...prev, isActive }))}
                            label="Active"
                        />
                        <CatalogCheckboxCard
                            checked={formData.isPopular}
                            onChange={(isPopular) => setFormData((prev) => ({ ...prev, isPopular }))}
                            label="Popular"
                        />
                    </div>
                </div>
            )}
        />
    );
}
