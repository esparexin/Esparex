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
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <Label htmlFor="profile-email" className="text-caption font-semibold text-foreground-secondary">
                    Notification & Invoice Email <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
            </div>
            <Input
                id="profile-email"
                type="email"
                placeholder="name@company.com"
                {...register("email")}
                className={`h-10 rounded-xl bg-card border-border px-3.5 text-caption sm:text-body font-medium ${emailError ? "border-destructive" : ""}`}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "profile-email-error" : "profile-email-helper"}
                autoComplete="email"
            />
            <p id="profile-email-helper" className="text-tiny text-muted-foreground">
                Used strictly to send PDF invoices and ad status updates.
            </p>
            <FormError id="profile-email-error" message={emailError} />
        </div>
    );
}
