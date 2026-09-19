"use client";

import { Checkbox, Input, Label } from "@esparex/ui";
import { CheckCircle2 } from "@esparex/ui";

interface PlanCheckoutGstSectionProps {
    wantsGst: boolean;
    onWantsGstChange: (checked: boolean) => void;
    gstin: string;
    onGstinChange: (value: string) => void;
    isGstValid: boolean;
}

export function PlanCheckoutGstSection({
    wantsGst,
    onWantsGstChange,
    gstin,
    onGstinChange,
    isGstValid,
}: PlanCheckoutGstSectionProps) {
    return (
        <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center gap-2">
                <Checkbox
                    id="checkout-wants-gst"
                    checked={wantsGst}
                    onCheckedChange={(checked) => onWantsGstChange(Boolean(checked))}
                />
                <Label htmlFor="checkout-wants-gst" className="text-caption font-medium text-foreground cursor-pointer">
                    I need a B2B Tax Invoice for Input Tax Credit (ITC)
                </Label>
            </div>

            {wantsGst && (
                <div className="pl-6 flex flex-col gap-1.5 pt-1">
                    <Label htmlFor="checkout-gstin" className="text-caption sm:text-small font-medium text-foreground-secondary">
                        GSTIN Number
                    </Label>
                    <Input
                        id="checkout-gstin"
                        type="text"
                        placeholder="e.g. 27AAAAA0000A1Z5"
                        maxLength={15}
                        value={gstin}
                        onChange={(e) => onGstinChange(e.target.value.toUpperCase())}
                        className="h-11 rounded-xl text-body-lg md:text-body bg-card border-border px-3.5 uppercase font-mono font-normal text-foreground shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                    />
                    {gstin && !isGstValid && (
                        <p className="text-caption font-medium text-destructive">Please enter a valid 15-character GSTIN (e.g. 27AAAAA0000A1Z5)</p>
                    )}
                    {isGstValid && (
                        <p className="text-caption font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Valid GSTIN. B2B Tax Invoice enabled.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
