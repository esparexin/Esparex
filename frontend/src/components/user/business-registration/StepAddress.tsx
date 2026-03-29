import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import { normalizeCoordinates } from "@/lib/location/utils";
import { lookupPincode, type Location } from "@/lib/api/user/locations";
import type { StepBaseProps } from "./types";

interface StepAddressProps extends StepBaseProps { }

type PincodeLookupState = "idle" | "searching" | "resolved" | "manual";

export const applyResolvedPincodeLocation = ({
    bestMatch,
    setFormData,
}: {
    bestMatch: Location;
    setFormData: StepAddressProps["setFormData"];
}) => {
    const normalizedCoordinates = normalizeCoordinates(bestMatch.coordinates) || null;
    setFormData((previous) => ({
        ...previous,
        locationId: bestMatch.locationId || bestMatch.id,
        city: bestMatch.city || bestMatch.name,
        state: bestMatch.state,
        coordinates: normalizedCoordinates,
    }));
};

function AddressField({
    id,
    label,
    placeholder,
    value,
    error,
    onChange,
    helperText,
    autoDetected = false,
}: {
    id: keyof StepAddressProps["formData"];
    label: string;
    placeholder: string;
    value: string;
    error?: string;
    onChange: (val: string) => void;
    helperText?: string;
    autoDetected?: boolean;
}) {
    return (
        <Field label={label} error={error} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">{helperText}</span>
                {autoDetected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                        <Lock className="h-3 w-3" />
                        Auto-filled
                    </span>
                )}
            </div>
            <Input
                id={id as string}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={Boolean(error)}
            />
        </Field>
    );
}

export function StepAddress({
    formData,
    setFormData,
}: StepAddressProps) {
    const { pincode, city, state } = formData;
    const [showLandmark, setShowLandmark] = useState(Boolean(formData.landmark));
    const [lastFetchedPincode, setLastFetchedPincode] = useState("");
    const [resolvedPincode, setResolvedPincode] = useState("");
    const [lookupState, setLookupState] = useState<PincodeLookupState>("idle");
    const [lookupMessage, setLookupMessage] = useState("Enter a 6-digit pincode to auto-fill city and state.");

    useEffect(() => {
        if (!pincode) {
            setLastFetchedPincode("");
            setResolvedPincode("");
            setLookupState("idle");
            setLookupMessage("Enter a 6-digit pincode to auto-fill city and state.");
            return;
        }

        if (pincode.length < 6) {
            setLastFetchedPincode("");
            if (resolvedPincode && pincode !== resolvedPincode) {
                setResolvedPincode("");
                setFormData((previous) => ({
                    ...previous,
                    locationId: null,
                    city: "",
                    state: "",
                    coordinates: null,
                }));
                setLookupState("manual");
                setLookupMessage("Pincode changed, so the previous city and state were cleared. Finish all 6 digits to look up the new location.");
                return;
            }

            setLookupState("idle");
            setLookupMessage("Enter all 6 digits to auto-fill city and state, or type them manually.");
            return;
        }

        if (pincode === resolvedPincode && formData.city && formData.state) {
            setLookupState("resolved");
            setLookupMessage("City and state were auto-filled from this pincode. You can still edit them if needed.");
            return;
        }

        if (pincode === lastFetchedPincode) {
            return;
        }

        let cancelled = false;

        const fetchPincode = async () => {
            setLastFetchedPincode(pincode);
            setLookupState("searching");
            setLookupMessage("Looking up city and state from this pincode...");

            if (resolvedPincode && pincode !== resolvedPincode) {
                setResolvedPincode("");
                setFormData((previous) => ({
                    ...previous,
                    city: "",
                    state: "",
                    coordinates: null,
                }));
            }

            try {
                const result = await lookupPincode(pincode);

                if (cancelled) {
                    return;
                }

                if (result) {
                    applyResolvedPincodeLocation({
                        bestMatch: result,
                        setFormData,
                    });
                    setResolvedPincode(pincode);
                    setLookupState("resolved");
                    setLookupMessage("City and state were auto-filled from this pincode. You can still edit them if needed.");
                    return;
                }

                setResolvedPincode("");
                setFormData((previous) => ({
                    ...previous,
                    locationId: null,
                    city: "",
                    state: "",
                    coordinates: null,
                }));
                setLookupState("manual");
                setLookupMessage("We could not find this pincode in our database. Please enter city and state manually.");
            } catch (error) {
                if (cancelled) {
                    return;
                }

                logger.error("Pincode fetch error", error);
                setResolvedPincode("");
                setFormData((previous) => ({
                    ...previous,
                    locationId: null,
                    city: "",
                    state: "",
                    coordinates: null,
                }));
                setLookupState("manual");
                setLookupMessage("Location lookup failed. Please enter city and state manually.");
            }
        };

        void fetchPincode();

        return () => {
            cancelled = true;
        };
    }, [city, lastFetchedPincode, pincode, resolvedPincode, setFormData, state]);

    return (
        <div className="space-y-6">
            <div
                className={cn(
                    "rounded-2xl border px-4 py-3 text-sm",
                    lookupState === "searching"
                        ? "border-blue-200 bg-blue-50 text-blue-800"
                        : lookupState === "manual"
                            ? "border-amber-200 bg-amber-50 text-amber-900"
                            : lookupState === "resolved"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                : "border-slate-200 bg-slate-50 text-slate-700",
                )}
            >
                <div className="flex items-start gap-3">
                    {lookupState === "searching" ? (
                        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                        <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-current" />
                    )}
                    <p className="leading-6">{lookupMessage}</p>
                </div>
            </div>

            <Field
                label="Pincode"
                required
                error={formData.errors?.pincode}
                className="space-y-2"
            >
                <p className="text-xs text-slate-500">Enter the shop pincode first. We’ll try to fill city and state automatically.</p>
                <Input
                    id="pincode"
                    placeholder="500001"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => {
                        const nextPincode = e.target.value.replace(/\D/g, "");
                        const shouldResetResolvedLocation = nextPincode !== resolvedPincode;
                        setFormData({
                            ...formData,
                            pincode: nextPincode,
                            ...(shouldResetResolvedLocation ? { locationId: null, coordinates: null } : {}),
                        });
                    }}
                    aria-invalid={Boolean(formData.errors?.pincode)}
                />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
                <AddressField
                    id="city"
                    label="City *"
                    placeholder="Enter city name"
                    value={formData.city}
                    onChange={(value) => {
                        setResolvedPincode("");
                        setLookupState("manual");
                        setLookupMessage("City was edited manually. Make sure it matches the pincode above.");
                        setFormData({ ...formData, city: value, locationId: null, coordinates: null });
                    }}
                    error={formData.errors?.city}
                    helperText="Customers see this on your public business profile."
                    autoDetected={resolvedPincode === formData.pincode && Boolean(formData.city)}
                />
                <AddressField
                    id="state"
                    label="State *"
                    placeholder="Enter state name"
                    value={formData.state}
                    onChange={(value) => {
                        setResolvedPincode("");
                        setLookupState("manual");
                        setLookupMessage("State was edited manually. Make sure it matches the pincode above.");
                        setFormData({ ...formData, state: value, locationId: null, coordinates: null });
                    }}
                    error={formData.errors?.state}
                    helperText="This helps us place your store in local search correctly."
                    autoDetected={resolvedPincode === formData.pincode && Boolean(formData.state)}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <AddressField
                    id="shopNo"
                    label="Shop no. or building name *"
                    placeholder="e.g. Shop 12, A-Block"
                    value={formData.shopNo}
                    onChange={(value) => setFormData({ ...formData, shopNo: value })}
                    error={formData.errors?.shopNo}
                    helperText="Use the exact shop, office, or unit identifier customers will see."
                />
                <AddressField
                    id="street"
                    label="Street, colony, or area *"
                    placeholder="e.g. Main Road, Gandhi Nagar"
                    value={formData.street}
                    onChange={(value) => setFormData({ ...formData, street: value })}
                    error={formData.errors?.street}
                    helperText="This should match the main street or locality of your business."
                />
            </div>

            {showLandmark || formData.landmark ? (
                <AddressField
                    id="landmark"
                    label="Landmark"
                    placeholder="e.g. Near HDFC Bank"
                    value={formData.landmark}
                    onChange={(value) => setFormData({ ...formData, landmark: value })}
                    helperText="Optional, but useful if customers often ask for directions."
                />
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLandmark(true)}
                    className="h-10 w-full rounded-xl border-dashed border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                    Add landmark (optional)
                </Button>
            )}
        </div>
    );
}
