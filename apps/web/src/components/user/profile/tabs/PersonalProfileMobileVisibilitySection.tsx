"use client";

import { Controller, type Control } from "react-hook-form";
import { Label } from "@esparex/ui";
import type { PersonalProfileValues } from "@esparex/contracts";

interface PersonalProfileMobileVisibilitySectionProps {
    control: Control<PersonalProfileValues>;
}

const VISIBILITY_OPTIONS = [
    { value: 'show', label: 'Show Number' },
    { value: 'on_request', label: 'On Request' },
    { value: 'hide', label: 'Hide Number' },
] as const;

export function PersonalProfileMobileVisibilitySection({
    control,
}: PersonalProfileMobileVisibilitySectionProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Label className="text-caption font-semibold text-foreground-secondary">
                Phone Number Privacy
            </Label>
            <Controller
                name="mobileVisibility"
                control={control}
                render={({ field }) => (
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-xl border border-border bg-muted/40" role="radiogroup" aria-label="Phone Number Privacy">
                        {VISIBILITY_OPTIONS.map((opt) => {
                            const isSelected = field.value === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    onClick={() => field.onChange(opt.value)}
                                    className={`h-8 px-2.5 text-tiny sm:text-caption font-semibold rounded-lg transition-all flex items-center justify-center text-center ${
                                        isSelected
                                            ? "bg-primary text-primary-foreground shadow-2xs"
                                            : "text-foreground-secondary hover:bg-card hover:text-foreground"
                                    }`}
                                >
                                    <span>{opt.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            />
        </div>
    );
}
