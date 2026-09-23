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
        <div className="flex flex-col gap-1.5 scroll-mt-[calc(6rem+env(safe-area-inset-top,0px))]">
            <Label htmlFor="profile-business-name" className="text-body font-semibold text-foreground-secondary">
                Business Name <span className="text-tiny font-normal text-muted-foreground ml-1">(Optional)</span>
            </Label>
            <Input
                id="profile-business-name"
                type="text"
                placeholder="e.g. Acme Spares Pvt Ltd"
                className="h-11 text-body-lg md:text-body rounded-xl border-border bg-card px-3.5 font-normal text-foreground placeholder:text-body-lg md:placeholder:text-body placeholder:text-foreground-subtle focus-visible:ring-2 focus-visible:ring-primary scroll-mt-[calc(7.5rem+env(safe-area-inset-top,0px))]"
                {...register("businessName")}
            />
            <FormError id="profile-business-name-error" message={businessNameError} />
        </div>
    );
}
