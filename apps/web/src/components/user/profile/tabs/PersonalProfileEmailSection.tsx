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
                <Label htmlFor="profile-email" className="text-xs font-semibold text-slate-700">
                    Notification & Invoice Email <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
            </div>
            <Input
                id="profile-email"
                type="email"
                placeholder="name@company.com"
                {...register("email")}
                className={`h-10 sm:h-10.5 rounded-xl bg-white border-slate-200 px-3.5 text-xs sm:text-sm font-medium ${emailError ? "border-red-500" : ""}`}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "profile-email-error" : "profile-email-helper"}
                autoComplete="email"
            />
            <p id="profile-email-helper" className="text-tiny text-slate-500">
                Used strictly to send PDF invoices and ad status updates.
            </p>
            <FormError id="profile-email-error" message={emailError} />
        </div>
    );
}
