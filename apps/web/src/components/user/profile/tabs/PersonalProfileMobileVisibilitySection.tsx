"use client";

import { Controller, type Control } from "react-hook-form";
import { Label } from "@esparex/ui";
import type { PersonalProfileValues } from "@esparex/contracts";

interface PersonalProfileMobileVisibilitySectionProps {
    control: Control<PersonalProfileValues>;
}

const VISIBILITY_OPTIONS = [
    { value: 'show', label: 'Show' },
    { value: 'on_request', label: 'On Request' },
    { value: 'hide', label: 'Hide' },
] as const;

export function PersonalProfileMobileVisibilitySection({
    control,
}: PersonalProfileMobileVisibilitySectionProps) {
    return (
        <div className="space-y-1">
            <Label className="text-caption font-semibold text-foreground-secondary">
                Phone Number Privacy
            </Label>
            <Controller
                name="mobileVisibility"
                control={control}
                render={({ field }) => (
                    <div className="grid grid-cols-3 gap-1 p-1 h-10 rounded-xl border border-border bg-card items-center" role="radiogroup" aria-label="Phone Number Privacy">
                        {VISIBILITY_OPTIONS.map((opt) => {
                            const isSelected = field.value === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    onClick={() => field.onChange(opt.value)}
                                    className={`h-8 px-1.5 text-tiny font-semibold rounded-lg transition-all flex items-center justify-center text-center truncate ${
                                        isSelected
                                            ? "bg-primary text-primary-foreground shadow-2xs"
                                            : "text-foreground-secondary hover:bg-muted hover:text-foreground"
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
