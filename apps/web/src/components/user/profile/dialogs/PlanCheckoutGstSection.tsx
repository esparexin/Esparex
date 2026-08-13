"use client";

import { Checkbox, Input, Label } from "@esparex/ui";
import { CheckCircle2 } from "@/icons/IconRegistry";

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
                <Label htmlFor="checkout-wants-gst" className="text-xs font-medium text-slate-800 cursor-pointer">
                    I need a B2B Tax Invoice for Input Tax Credit (ITC)
                </Label>
            </div>

            {wantsGst && (
                <div className="pl-6 flex flex-col gap-1.5 pt-1">
                    <Label htmlFor="checkout-gstin" className="text-[11px] font-semibold text-slate-700">
                        GSTIN Number
                    </Label>
                    <Input
                        id="checkout-gstin"
                        type="text"
                        placeholder="e.g. 27AAAAA0000A1Z5"
                        maxLength={15}
                        value={gstin}
                        onChange={(e) => onGstinChange(e.target.value.toUpperCase())}
                        className="h-8 rounded-lg text-xs bg-white uppercase font-mono"
                    />
                    {gstin && !isGstValid && (
                        <p className="text-[10px] text-amber-600">Please enter a valid 15-character GSTIN (e.g. 27AAAAA0000A1Z5)</p>
                    )}
                    {isGstValid && (
                        <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 inline" /> Valid GSTIN. B2B Tax Invoice enabled.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
