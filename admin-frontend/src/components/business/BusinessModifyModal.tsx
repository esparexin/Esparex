"use client";
import { mapErrorToMessage } from '@/lib/mapErrorToMessage';

import { useEffect, useState } from "react";
import { Loader2, Pencil, MapPin, Search } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Business } from "@/types/business";
import { AdminApiError } from "@/lib/api/adminClient";
import { getLocationOptions } from "@/lib/api/locations";
import type { Location } from "@/types/location";

type CanonicalCoordinates = Business["location"]["coordinates"] | null;

const formatLocationLabel = (location: {
    display?: string;
    name?: string;
    city?: string;
    state?: string;
    level?: string;
}) => {
    return (
        location.display ||
        [location.name || location.city, location.state].filter(Boolean).join(", ") ||
        location.name ||
        location.city ||
        "Unknown location"
    );
};

interface BusinessModifyModalProps {
    business: Business;
    onClose: () => void;
    onConfirm: (patch: Partial<Business>) => Promise<void>;
}

export function BusinessModifyModal({ business, onClose, onConfirm }: BusinessModifyModalProps) {
    const [form, setForm] = useState({
        name: business.name ?? "",
        description: business.description ?? "",
        mobile: business.mobile ?? "",
        email: business.email ?? "",
        website: business.website ?? "",
        gstNumber: business.gstNumber ?? "",
        registrationNumber: business.registrationNumber ?? "",
        shopNo: business.location?.shopNo ?? "",
        street: business.location?.street ?? "",
        landmark: business.location?.landmark ?? "",
        address: business.location?.address ?? "",
        city: business.location?.city ?? "",
        state: business.location?.state ?? "",
        pincode: business.location?.pincode ?? "",
        locationId: business.location?.locationId ?? business.locationId ?? "",
        coordinates: (business.location?.coordinates ?? null) as CanonicalCoordinates,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [locationResults, setLocationResults] = useState<Location[]>([]);
    const [locationSearchLoading, setLocationSearchLoading] = useState(false);
    const [locationSearchError, setLocationSearchError] = useState("");
    const [selectedLocationLabel, setSelectedLocationLabel] = useState(
        form.locationId
            ? formatLocationLabel({
                display: business.location?.display,
                city: business.location?.city,
                state: business.location?.state,
            })
            : "",
    );
    type FormTextKey = Exclude<keyof typeof form, "coordinates">;

    useEffect(() => {
        const nextQuery = locationQuery.trim();
        if (nextQuery.length < 2) {
            setLocationResults([]);
            setLocationSearchLoading(false);
            setLocationSearchError("");
            return;
        }

        let active = true;
        const timer = window.setTimeout(async () => {
            setLocationSearchLoading(true);
            setLocationSearchError("");
            try {
                const nextResults = await getLocationOptions({
                    search: nextQuery,
                    status: "active",
                    limit: 8,
                });

                if (!active) return;
                setLocationResults(
                    nextResults.filter((location) => location.level !== "country" && location.level !== "state"),
                );
            } catch (searchError) {
                if (!active) return;
                setLocationResults([]);
                setLocationSearchError(
                    AdminApiError.resolveMessage(searchError, "Failed to search active locations"),
                );
            } finally {
                if (active) {
                    setLocationSearchLoading(false);
                }
            }
        }, 250);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [locationQuery]);

    const field = (key: FormTextKey, label: string, opts?: { type?: string; rows?: number }) => (
        <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
            {opts?.rows ? (
                <textarea
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                    rows={opts.rows}
                    value={form[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    disabled={loading}
                />
            ) : (
                <input
                    type={opts?.type ?? "text"}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={form[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    disabled={loading}
                />
            )}
        </div>
    );

    const handleCanonicalLocationSelect = (location: Location) => {
        setForm((previous) => ({
            ...previous,
            locationId: location.locationId || location.id,
            coordinates: location.coordinates ?? null,
            city: location.city || location.name || previous.city,
            state: location.state || previous.state,
        }));
        setSelectedLocationLabel(formatLocationLabel(location));
        setLocationQuery("");
        setLocationResults([]);
        setLocationSearchError("");
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            setError("Business name is required.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const patch: Record<string, unknown> = {
                name: form.name.trim(),
                description: form.description.trim(),
                mobile: form.mobile.trim(),
                email: form.email.trim(),
                website: form.website.trim(),
                gstNumber: form.gstNumber.trim(),
                registrationNumber: form.registrationNumber.trim(),
                location: {
                    ...(form.locationId.trim() ? { locationId: form.locationId.trim() } : {}),
                    shopNo: form.shopNo.trim(),
                    street: form.street.trim(),
                    landmark: form.landmark.trim(),
                    address: form.address.trim(),
                    city: form.city.trim(),
                    state: form.state.trim(),
                    pincode: form.pincode.trim(),
                    ...(form.coordinates ? { coordinates: form.coordinates } : {}),
                },
            };
            await onConfirm(patch as Partial<Business>);
            onClose();
        } catch (err) {
            setError(mapErrorToMessage(err, "Failed to update business"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl p-0 flex flex-col">
                <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Pencil size={18} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-900">Modify Business</DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 mt-0.5">
                                Editing <span className="font-semibold text-slate-700">{business.name}</span> — status will remain unchanged.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    {/* Core Info */}
                    <section className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Info</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {field("name", "Business Name *")}
                            {field("mobile", "Mobile Number")}
                            {field("email", "Email Address", { type: "email" })}
                            {field("website", "Website")}
                            {field("gstNumber", "GST Number")}
                            {field("registrationNumber", "Registration Number")}
                        </div>
                        {field("description", "Description", { rows: 3 })}
                    </section>

                    {/* Location */}
                    <section className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <MapPin size={12} /> Location
                        </p>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Canonical location</p>
                                <p className="text-xs text-slate-600">
                                    Search an active city, district, village, or area to repair the verified location link and map coordinates.
                                </p>
                            </div>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={locationQuery}
                                    onChange={(e) => setLocationQuery(e.target.value)}
                                    disabled={loading}
                                    placeholder="Search active city or area"
                                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                {locationSearchLoading ? (
                                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                                ) : null}
                            </div>
                            {selectedLocationLabel ? (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                                    Linked to: <span className="font-semibold">{selectedLocationLabel}</span>
                                </div>
                            ) : null}
                            {locationSearchError ? (
                                <p className="text-xs text-red-600">{locationSearchError}</p>
                            ) : null}
                            {locationResults.length > 0 ? (
                                <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                                    {locationResults.map((location) => (
                                        <button
                                            key={location.locationId || location.id}
                                            type="button"
                                            disabled={loading}
                                            onClick={() => handleCanonicalLocationSelect(location)}
                                            className="w-full rounded-lg border border-transparent px-3 py-2 text-left transition-all hover:border-primary/20 hover:bg-slate-50"
                                        >
                                            <p className="text-sm font-semibold text-slate-900">
                                                {formatLocationLabel(location)}
                                            </p>
                                            <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                                                {location.level}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {field("shopNo", "Shop / Unit")}
                            {field("street", "Street / Area")}
                            {field("landmark", "Landmark")}
                            {field("address", "Address Summary")}
                            {field("city", "City")}
                            {field("state", "State")}
                            {field("pincode", "Pincode")}
                        </div>
                    </section>

                    {error && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-white transition-all text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-5 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        <Pencil size={16} />
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
