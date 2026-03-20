"use client";

import { useRouter } from "next/navigation";
import { useNavigation } from "@/context/NavigationContext";
import { SparePartListingProvider, useSparePartListing } from "./SparePartListingContext";
import Step1PartDetails from "./steps/Step1PartDetails";
import Step2ListingInfo from "./steps/Step2ListingInfo";
import { FormError } from "@/components/ui/FormError";
import { cn } from "@/components/ui/utils";
import { WizardModalShell } from "@/components/user/wizard/WizardModalShell";

function SparePartListingWizardContent({ onClose }: { onClose: () => void }) {
    const { currentStep, totalSteps } = useSparePartListing();

    return (
        <WizardModalShell
            title="Post Spare Part"
            description="Complete the steps to list a spare part for sale."
            currentStep={currentStep}
            totalSteps={totalSteps}
            onClose={onClose}
            headerContent={
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">E</div>
                    <span className="font-bold text-slate-800 text-sm tracking-tight">Esparex</span>
                </div>
            }
            footer={<SparePartListingNavigation />}
        >
            <Step1PartDetails isActive={currentStep === 1} />
            <Step2ListingInfo isActive={currentStep === 2} />
        </WizardModalShell>
    );
}

function SparePartListingNavigation() {
    const { currentStep, totalSteps, nextStep, prevStep, submitListing, isSubmitting, formError, watch } = useSparePartListing();

    const isLastStep = currentStep === totalSteps;
    const canProceedFromStep1 = Boolean(watch("category") && watch("sparePartId"));

    return (
        <div>
            <FormError message={formError} className="mb-2 text-center" />
            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={prevStep}
                    disabled={currentStep === 1 || isSubmitting}
                    className={cn(
                        "px-6 py-2.5 rounded-full font-medium transition-colors",
                        currentStep === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-100"
                    )}
                >
                    Back
                </button>
                <button
                    onClick={isLastStep ? submitListing : nextStep}
                    disabled={isSubmitting || (!isLastStep && !canProceedFromStep1)}
                    className={cn(
                        "px-8 py-2.5 rounded-full font-bold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed",
                        isLastStep ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                    )}
                >
                    {isSubmitting ? "Processing..." : isLastStep ? "Post Spare Part" : "Continue"}
                </button>
            </div>
        </div>
    );
}

export default function SparePartListingWizard() {
    const router = useRouter();
    const { confirmNavigation } = useNavigation();

    const handleClose = () => {
        confirmNavigation(() => {
            router.back();
        });
    };

    return (
        <SparePartListingProvider>
            <SparePartListingWizardContent onClose={handleClose} />
        </SparePartListingProvider>
    );
}
