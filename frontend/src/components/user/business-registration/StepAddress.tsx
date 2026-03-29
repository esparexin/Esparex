import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight } from "@/icons/IconRegistry";
import { StepBaseProps } from "./types";
import { CompletedStepCard } from "./CompletedStepCard";
import { useState, useEffect } from "react";
import logger from "@/lib/logger";
import { normalizeCoordinates } from "@/lib/location/utils";
import { useLocationDispatch } from "@/context/LocationContext";
import type { Location } from "@/lib/api/user/locations";

interface StepAddressProps extends StepBaseProps { }

export const applyResolvedPincodeLocation = ({
    formData,
    bestMatch,
    setFormData,
    setManualLocation,
}: {
    formData: StepAddressProps["formData"];
    bestMatch: Location;
    setFormData: StepAddressProps["setFormData"];
    setManualLocation: ReturnType<typeof useLocationDispatch>["setManualLocation"];
}) => {
    const normalizedCoordinates = normalizeCoordinates(bestMatch.coordinates) || null;
    setFormData({
        ...formData,
        city: bestMatch.city || bestMatch.name,
        state: bestMatch.state,
        coordinates: normalizedCoordinates,
        pincodeError: undefined
    });
    if (normalizedCoordinates) {
        setManualLocation(
            bestMatch.city || bestMatch.name,
            bestMatch.state,
            bestMatch.display || bestMatch.name,
            bestMatch.locationId || bestMatch.id,
            normalizedCoordinates,
            { silent: true, country: bestMatch.country, level: bestMatch.level }
        );
    }
};

const AddressField = ({ 
    id, label, placeholder, value, error, onChange, isAutoDetected 
}: { 
    id: keyof StepAddressProps["formData"]; 
    label: string | React.ReactNode; 
    placeholder: string; 
    value: string; 
    error?: string; 
    onChange: (val: string) => void;
    isAutoDetected?: boolean;
}) => (
    <div className="space-y-2">
        <Label htmlFor={id as string} className="flex items-center gap-1.5">
            {label}
            {isAutoDetected && (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            )}
        </Label>
        <Input
            id={id as string}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={error ? "border-red-500" : "border-slate-200"}
        />
        {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
    </div>
);

export function StepAddress({
    formData,
    setFormData,
    onNext,
    onBack,
    isActive,
    isCompleted,
    onEdit
}: StepAddressProps) {

    const [lastFetchedPincode, setLastFetchedPincode] = useState("");
    const [resolvedPincode, setResolvedPincode] = useState("");
    const { setManualLocation } = useLocationDispatch();

    // Inside StepAddress:
    // Handle Pincode Auto-Fetch with Cache
    useEffect(() => {
        if (!isActive) return; // 🔒 Guard: Only run when step is active

        if (resolvedPincode && formData.pincode !== resolvedPincode) {
            setResolvedPincode("");
            setFormData((prev) => ({
                ...prev,
                city: "",
                state: "",
                coordinates: null,
                pincodeError: undefined,
            }));
        }

        if (formData.pincode.length === 6) {
            if (formData.pincode === lastFetchedPincode) return; // Prevent spam

            const fetchPincode = async () => {
                const pincodeSnapshot = formData.pincode;
                setLastFetchedPincode(pincodeSnapshot);
                try {
                    const { searchLocations } = await import("@/lib/api/user/locations");
                    const results = await searchLocations(pincodeSnapshot);

                    if (results && results.length > 0) {
                        applyResolvedPincodeLocation({
                            formData,
                            bestMatch: results[0]!,
                            setFormData,
                            setManualLocation,
                        });
                        setResolvedPincode(pincodeSnapshot);
                    } else {
                        // Not found — clear city/state so user can enter manually
                        setResolvedPincode("");
                        setFormData((prev) => ({
                            ...prev,
                            city: "",
                            state: "",
                            coordinates: null,
                            pincodeError: "Pincode not found in our database. Please enter city and state manually."
                        }));
                    }
                } catch (e) {
                    logger.error("Pincode fetch error", e);
                    setResolvedPincode("");
                    setFormData((prev) => ({
                        ...prev,
                        city: "",
                        state: "",
                        coordinates: null,
                        pincodeError: "Could not fetch location. Please enter city and state manually."
                    }));
                }
            };
            fetchPincode();
        } else if (formData.pincodeError) {
            // Clear error if they start typing a new one
            setFormData((prev) => ({ ...prev, pincodeError: undefined }));
        }
    }, [formData.pincode, formData.pincodeError, isActive, lastFetchedPincode, resolvedPincode]); // eslint-disable-line react-hooks/exhaustive-deps

    if (isCompleted && !isActive) {
        return (
            <CompletedStepCard
                title="Business Address"
                summary={`${formData.shopNo}, ${formData.street}, ${formData.city}`}
                onEdit={onEdit}
            />
        );
    }

    if (!isActive) return null;

    return (
        <div className="space-y-6">
            <Card className="shadow-sm">
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AddressField
                            id="shopNo"
                            label="Shop No. / Building Name *"
                            placeholder="e.g. Shop 12, A-Block"
                            value={formData.shopNo}
                            onChange={v => setFormData({ ...formData, shopNo: v })}
                            error={formData.errors?.shopNo}
                        />
                        <AddressField
                            id="street"
                            label="Street / Colony / Area *"
                            placeholder="e.g. Main Road, Gandhi Nagar"
                            value={formData.street}
                            onChange={v => setFormData({ ...formData, street: v })}
                            error={formData.errors?.street}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="landmark">Landmark (Optional)</Label>
                        <Input
                            id="landmark"
                            placeholder="e.g. Near HDFC Bank"
                            value={formData.landmark}
                            onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pincode">Pincode *</Label>
                            <Input
                                id="pincode"
                                placeholder="500001"
                                maxLength={6}
                                value={formData.pincode}
                                onChange={e => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                                className={formData.pincodeError ? "border-red-500" : ""}
                            />
                            {formData.pincodeError && (
                                <p className="text-xs text-red-500 mt-1">{formData.pincodeError}</p>
                            )}
                        </div>
                        <AddressField
                            id="city"
                            label="City"
                            placeholder={!formData.city ? "Enter city name" : "Auto-detected from pincode"}
                            value={formData.city}
                            onChange={v => {
                                setResolvedPincode("");
                                setFormData({ ...formData, city: v });
                            }}
                            error={formData.errors?.city}
                            isAutoDetected={resolvedPincode === formData.pincode && Boolean(formData.city)}
                        />
                        <AddressField
                            id="state"
                            label="State"
                            placeholder={!formData.state ? "Enter state name" : "Auto-detected from pincode"}
                            value={formData.state}
                            onChange={v => {
                                setResolvedPincode("");
                                setFormData({ ...formData, state: v });
                            }}
                            error={formData.errors?.state}
                            isAutoDetected={resolvedPincode === formData.pincode && Boolean(formData.state)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-between gap-4 md:static md:bg-transparent md:border-0 md:p-0 md:mt-8">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1 md:flex-none h-12 px-8 rounded-xl border-slate-200">
                    Back
                </Button>
                <Button
                    type="button"
                    onClick={onNext}
                    className="flex-1 md:flex-none h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100"
                >
                    Continue
                    <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
