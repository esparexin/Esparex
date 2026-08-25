"use client";

import { Controller, type Control } from "react-hook-form";
import { Label } from "@esparex/ui";
import type { PersonalProfileValues } from "@esparex/contracts";

interface PersonalProfileMobileVisibilitySectionProps {
    control: Control<PersonalProfileValues>;
}

const VISIBILITY_OPTIONS = [
    { value: 'show', label: 'Show Number', desc: 'Direct calls allowed' },
    { value: 'on_request', label: 'On Request', desc: 'Permission required' },
    { value: 'hide', label: 'Hide Number', desc: 'In-app chat only' },
] as const;

export function PersonalProfileMobileVisibilitySection({
    control,
}: PersonalProfileMobileVisibilitySectionProps) {
    return (
        <div className="flex flex-col gap-2">
            <Label className="text-caption font-semibold text-foreground-secondary">
                Phone Number Privacy
            </Label>
            <Controller
                name="mobileVisibility"
                control={control}
                render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Phone Number Privacy">
                        {VISIBILITY_OPTIONS.map((opt) => {
                            const isSelected = field.value === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    onClick={() => field.onChange(opt.value)}
                                    className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                                        isSelected
                                            ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                                            : "border-border bg-card hover:bg-muted/50"
                                    }`}
                                >
                                    <span className={`text-caption font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                                        {opt.label}
                                    </span>
                                    <span className="text-tiny text-muted-foreground mt-0.5">
                                        {opt.desc}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            />
        </div>
    );
}
