"use client";

import { Input, Label, FormError } from "@esparex/ui";
import type { UseFormRegister } from "react-hook-form";
import type { PersonalProfileValues } from "@esparex/contracts";

interface PersonalProfileGstSectionProps {
    register: UseFormRegister<PersonalProfileValues>;
    gstinError?: string;
}

export function PersonalProfileGstSection({
    register,
    gstinError,
}: PersonalProfileGstSectionProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <Label htmlFor="profile-gstin" className="text-caption sm:text-small font-medium text-foreground-secondary">
                    GSTIN Number <span className="text-tiny font-normal text-muted-foreground ml-1">(Optional)</span>
                </Label>
            </div>
            <Input
                id="profile-gstin"
                type="text"
                placeholder="e.g. 27AAAAA0000A1Z5"
                maxLength={15}
                {...register("gstin")}
                className={`h-11 rounded-xl bg-card border-border px-3.5 text-body-lg md:text-body font-normal text-foreground placeholder:text-small placeholder:text-foreground-subtle uppercase placeholder:normal-case ${gstinError ? "border-destructive" : ""}`}
                aria-invalid={!!gstinError}
                aria-describedby={gstinError ? "profile-gstin-error" : undefined}
            />
            <FormError id="profile-gstin-error" message={gstinError} />
        </div>
    );
}
