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
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <Label htmlFor="profile-gstin" className="text-xs font-semibold text-slate-700">
                    GSTIN Number <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
            </div>
            <Input
                id="profile-gstin"
                type="text"
                placeholder="e.g. 27AAAAA0000A1Z5"
                maxLength={15}
                {...register("gstin")}
                className={`h-10 sm:h-10.5 rounded-xl bg-white border-slate-200 px-3.5 text-xs sm:text-sm font-medium uppercase ${gstinError ? "border-red-500" : ""}`}
                aria-invalid={!!gstinError}
                aria-describedby={gstinError ? "profile-gstin-error" : "profile-gstin-helper"}
            />
            <p id="profile-gstin-helper" className="text-tiny text-slate-500">
                Enter your 15-character GSTIN to claim 18% Input Tax Credit (ITC) on B2B invoices.
            </p>
            <FormError id="profile-gstin-error" message={gstinError} />
        </div>
    );
}
