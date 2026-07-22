"use client";

import { useEffect, useState } from "react";
import { getLocationOptions } from "@/lib/api/locations";
import { type Location } from "@/types/location";
import {
    CatalogCheckboxCard,
    CatalogSelectField,
    CatalogTextInputField,
} from "@/components/catalog/CatalogUiPrimitives";

export type LocationFormLevel = "state" | "city" | "area";

export type LocationFormData = {
    name: string;
    level: LocationFormLevel;
    parentId: string;
    parentStateId: string;
    longitude: string;
    latitude: string;
    isActive: boolean;
    country: string;
};

export function LocationFormFields({
    formData,
    setFormData,
    stateOptions,
}: {
    formData: LocationFormData;
    setFormData: React.Dispatch<React.SetStateAction<LocationFormData>>;
    stateOptions: Location[];
}) {
    const [cityOptions, setCityOptions] = useState<Location[]>([]);

    useEffect(() => {
        let active = true;

        const loadCities = async () => {
            if (formData.level !== "area" || !formData.parentStateId) {
                setCityOptions([]);
                return;
            }

            const parentState = stateOptions.find((option) => option.id === formData.parentStateId);
            if (!parentState?.name) {
                setCityOptions([]);
                return;
            }

            const nextCities = await getLocationOptions({
                level: "city",
                state: parentState.name,
                status: "active",
                limit: 100,
            });

            if (active) {
                setCityOptions(nextCities);
            }
        };

        void loadCities();

        return () => {
            active = false;
        };
    }, [formData.level, formData.parentStateId, stateOptions]);

    useEffect(() => {
        if (formData.level === "state" && (formData.parentId || formData.parentStateId)) {
            setFormData((prev) => ({ ...prev, parentId: "", parentStateId: "" }));
        }

        if (formData.level === "city" && formData.parentStateId) {
            setFormData((prev) => ({ ...prev, parentStateId: "" }));
        }
    }, [formData.level, formData.parentId, formData.parentStateId, setFormData]);

    return (
        <div className="space-y-4">
            <CatalogSelectField
                label="Location Level"
                value={formData.level}
                onChange={(level) =>
                    setFormData((prev) => ({
                        ...prev,
                        level: level as LocationFormLevel,
                        parentId: "",
                        parentStateId: "",
                    }))
                }
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

            {formData.level === "city" && (
                <CatalogSelectField
                    label="Parent State"
                    value={formData.parentId}
                    onChange={(parentId) => setFormData((prev) => ({ ...prev, parentId }))}
                    options={stateOptions.map((state) => ({
                        value: state.id,
                        label: state.name,
                    }))}
                    required
                    placeholder="Select a state"
                />
            )}

            {formData.level === "area" && (
                <>
                    <CatalogSelectField
                        label="State"
                        value={formData.parentStateId}
                        onChange={(parentStateId) =>
                            setFormData((prev) => ({
                                ...prev,
                                parentStateId,
                                parentId: "",
                            }))
                        }
                        options={stateOptions.map((state) => ({
                            value: state.id,
                            label: state.name,
                        }))}
                        required
                        placeholder="Select a state"
                    />

                    <CatalogSelectField
                        label="Parent City"
                        value={formData.parentId}
                        onChange={(parentId) => setFormData((prev) => ({ ...prev, parentId }))}
                        options={cityOptions.map((city) => ({
                            value: city.id,
                            label: city.name,
                        }))}
                        required
                        placeholder={formData.parentStateId ? "Select a city" : "Select a state first"}
                    />
                </>
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

            <div className="grid grid-cols-1 gap-4">
                <CatalogCheckboxCard
                    checked={formData.isActive}
                    onChange={(isActive) => setFormData((prev) => ({ ...prev, isActive }))}
                    label="Active"
                />
            </div>
        </div>
    );
}
