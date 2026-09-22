"use client";

import { Input, Label, FormError } from "@esparex/ui";
import type { UseFormRegister } from "react-hook-form";
import type { PersonalProfileValues } from "@esparex/contracts";

interface PersonalProfileEmailSectionProps {
    register: UseFormRegister<PersonalProfileValues>;
    emailError?: string;
}

export function PersonalProfileEmailSection({
    register,
    emailError,
}: PersonalProfileEmailSectionProps) {
    return (
        <div className="flex flex-col gap-1.5 scroll-mt-[calc(6rem+env(safe-area-inset-top,0px))]">
            <div className="flex items-center justify-between">
                <Label htmlFor="profile-email" className="text-body font-semibold text-foreground-secondary">
                    Notification & Invoice Email <span className="text-tiny font-normal text-muted-foreground ml-1">(Optional)</span>
                </Label>
            </div>
            <Input
                id="profile-email"
                type="email"
                placeholder="your@email.com"
                {...register("email")}
                className={`h-11 rounded-xl bg-card border-border px-3.5 text-body-lg md:text-body font-normal text-foreground placeholder:text-foreground-subtle scroll-mt-[calc(7.5rem+env(safe-area-inset-top,0px))] ${emailError ? "border-destructive" : ""}`}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "profile-email-error" : undefined}
                autoComplete="email"
            />
            <FormError id="profile-email-error" message={emailError} />
        </div>
    );
}
