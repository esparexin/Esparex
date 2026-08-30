"use client";

import { Input, Label, FormError } from "@esparex/ui";
import type { UseFormRegister } from "react-hook-form";
import type { PersonalProfileValues } from "@esparex/contracts";

interface PersonalProfileBusinessSectionProps {
    register: UseFormRegister<PersonalProfileValues>;
    businessNameError?: string;
}

export function PersonalProfileBusinessSection({
    register,
    businessNameError,
}: PersonalProfileBusinessSectionProps) {
    return (
        <div className="space-y-1">
            <Label htmlFor="profile-business-name" className="text-caption font-semibold text-foreground-secondary">
                Business Name <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
                id="profile-business-name"
                type="text"
                placeholder="e.g. Acme Spares Pvt Ltd"
                className="h-10 text-body-lg md:text-body rounded-xl border-border bg-card px-3.5 font-medium focus-visible:ring-2 focus-visible:ring-primary"
                {...register("businessName")}
            />
            <FormError id="profile-business-name-error" message={businessNameError} />
        </div>
    );
}
