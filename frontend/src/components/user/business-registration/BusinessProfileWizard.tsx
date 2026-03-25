"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import type { User } from "@/types/User";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/FormError";
import { StepBasicDetails } from "./StepBasicDetails";
import { StepAddress } from "./StepAddress";
import { StepDocuments } from "./StepDocuments";
import { StepReview } from "./StepReview";
import type { StepData } from "./types";

interface BusinessProfileWizardProps {
    headerVariant: "registration" | "edit";
    title: string;
    user: User | null;
    currentStep: number;
    formData: StepData;
    setFormData: React.Dispatch<React.SetStateAction<StepData>>;
    formError: string | null;
    isSubmitting: boolean;
    submitLabel: string;
    onNext: () => void;
    onHeaderBack: () => void;
    onStepChange: (step: number) => void;
    onSubmit: React.FormEventHandler<HTMLFormElement>;
    children?: ReactNode;
}

export function BusinessProfileWizard({
    headerVariant,
    title,
    user,
    currentStep,
    formData,
    setFormData,
    formError,
    isSubmitting,
    submitLabel,
    onNext,
    onHeaderBack,
    onStepChange,
    onSubmit,
    children,
}: BusinessProfileWizardProps) {
    const handleHeaderBack = () => {
        if (currentStep > 0) {
            onStepChange(currentStep - 1);
            return;
        }

        onHeaderBack();
    };

    return (
        <div className="bg-gray-50 py-8">
            <div className="bg-white border-b mb-8">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleHeaderBack}
                        className={headerVariant === "registration" ? "rounded-full h-10 w-10 text-slate-500" : undefined}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    {headerVariant === "registration" ? (
                        <>
                            <div className="h-4 w-px bg-slate-200 mx-1" />
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                    E
                                </div>
                                <h1 className="font-bold text-lg text-slate-900 tracking-tight">{title}</h1>
                            </div>
                        </>
                    ) : (
                        <h1 className="font-bold text-xl">{title}</h1>
                    )}
                </div>
            </div>

            <form className="max-w-4xl mx-auto px-4 space-y-4" onSubmit={onSubmit} noValidate>
                <FormError message={formError} className="mb-2" />

                <StepBasicDetails
                    formData={formData}
                    setFormData={setFormData}
                    user={user}
                    onNext={onNext}
                    isActive={currentStep === 0}
                    isCompleted={currentStep > 0}
                    onEdit={() => onStepChange(0)}
                />

                <StepAddress
                    formData={formData}
                    setFormData={setFormData}
                    onNext={onNext}
                    onBack={() => onStepChange(0)}
                    isActive={currentStep === 1}
                    isCompleted={currentStep > 1}
                    onEdit={() => onStepChange(1)}
                />

                <StepDocuments
                    formData={formData}
                    setFormData={setFormData}
                    onNext={onNext}
                    onBack={() => onStepChange(1)}
                    isActive={currentStep === 2}
                    isCompleted={currentStep > 2}
                    onEdit={() => onStepChange(2)}
                />

                <StepReview
                    formData={formData}
                    onBack={() => onStepChange(2)}
                    isActive={currentStep === 3}
                    onEditStep={onStepChange}
                    isSubmitting={isSubmitting}
                    submitLabel={submitLabel}
                />
            </form>

            {children}
        </div>
    );
}
