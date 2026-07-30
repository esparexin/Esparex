"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "@/icons/IconRegistry";
import type { User } from "@/types/User";
import { Button } from "@esparex/ui";
import { FormError } from "@/components/ui/FormError";
import { scrollToFirstError } from "@/lib/formHelpers";
import { StepBasicDetails } from "./StepBasicDetails";
import { StepAddress } from "./StepAddress";
import { FileUploadCard } from "./FileUploadCard";
import { ShopPhotosField } from "./ShopPhotosField";
import { BUSINESS_DOCUMENT_ACCEPT } from "@/schemas/business.schema.shared";
import type { StepData } from "./types";

interface BusinessProfileWizardProps {
    wizardVariant: "registration" | "application-edit" | "live-edit";
    title: string;
    user: User | null;
    currentStep: number;
    formData: StepData;
    setFormData: React.Dispatch<React.SetStateAction<StepData>>;
    formError: string | null;
    submissionStatus?: {
        title: string;
        detail: string;
    } | null;
    isSubmitting: boolean;
    submitLabel: string;
    onNext: () => void;
    onHeaderBack: () => void;
    onStepChange: (step: number) => void;
    onSubmit: React.FormEventHandler<HTMLFormElement>;
    onCancel?: () => void;
    children?: ReactNode;
}

export function BusinessProfileWizard({
    wizardVariant,
    title,
    user,
    currentStep,
    formData,
    setFormData,
    formError,
    submissionStatus,
    isSubmitting,
    submitLabel,
    onNext,
    onStepChange,
    onSubmit,
    onCancel,
    children,
}: BusinessProfileWizardProps) {
    const router = useRouter();
    const showDocumentsStep = wizardVariant !== "live-edit";

    const steps = [
        {
            label: "Business info",
            title: "Business information",
            description: "Add the business name, contact email, current location proof, and full address reviewers need first.",
            content: (
                <div className="space-y-6">
                    <StepBasicDetails
                        formData={formData}
                        setFormData={setFormData}
                        user={user}
                    />
                    <div className="border-t border-slate-100 pt-6">
                        <StepAddress
                            formData={formData}
                            setFormData={setFormData}
                        />
                    </div>
                </div>
            ),
        },
        {
            label: "Verification",
            title: wizardVariant === "live-edit" ? "Photos and review" : "Verification and review",
            description:
                wizardVariant === "live-edit"
                    ? "Refresh shop photos and review the business profile before saving."
                    : "Upload verification documents, add shop photos, and confirm everything before you submit.",
            content: (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
                    <ShopPhotosField
                        formData={formData}
                        setFormData={setFormData}
                    />

                    {showDocumentsStep ? (
                        <>
                            <FileUploadCard
                                title="Owner ID proof"
                                file={formData.idProof}
                                onUpload={(file) => setFormData({ ...formData, idProof: file })}
                                onRemove={() => setFormData({ ...formData, idProof: null })}
                                accept={BUSINESS_DOCUMENT_ACCEPT}
                                error={formData.errors?.idProof}
                            />

                            <FileUploadCard
                                title="Business proof"
                                file={formData.businessProof}
                                onUpload={(file) => setFormData({ ...formData, businessProof: file })}
                                onRemove={() => setFormData({ ...formData, businessProof: null })}
                                accept={BUSINESS_DOCUMENT_ACCEPT}
                                error={formData.errors?.businessProof}
                            />
                        </>
                    ) : null}
                </div>
            ),
        },
    ];

    const fallbackStep = steps[0] ?? {
        label: "Details",
        title,
        description: "",
        content: null,
    };
    const safeCurrentStep = Math.min(currentStep, Math.max(steps.length - 1, 0));
    const activeStep = steps[safeCurrentStep] ?? fallbackStep;
    const isFinalStep = safeCurrentStep === steps.length - 1;
    const primaryLabel = isFinalStep
        ? submitLabel
        : "Continue to verification";

    const headingRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            headingRef.current?.focus();
        }
    }, [safeCurrentStep]);

    return (
        <div className="mx-auto max-w-3xl py-2 md:py-4 px-4">
            <form
                className="flex flex-col gap-4 pb-20 sm:pb-0"
                onSubmit={(e) => {
                    onSubmit(e);
                    if (formError) {
                        scrollToFirstError();
                    }
                }}
                noValidate
            >
                {/* Header & Step progress */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                            Step {safeCurrentStep + 1} of {steps.length} • {activeStep.label}
                        </span>
                        <div className="flex gap-1.5" aria-hidden="true">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all ${
                                        idx === safeCurrentStep
                                            ? "w-8 bg-blue-600"
                                            : idx < safeCurrentStep
                                                ? "w-4 bg-emerald-500"
                                                : "w-4 bg-slate-200"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                    <h1
                        ref={headingRef}
                        tabIndex={-1}
                        className="text-xl font-bold tracking-tight text-foreground md:text-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
                    >
                        {title}
                    </h1>
                </div>

                <div role="alert" aria-live="polite">
                    <FormError message={formError} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700" />
                </div>
                {submissionStatus ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900" role="status" aria-live="polite">
                        <div className="flex items-start gap-3">
                            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                            <div className="space-y-0.5">
                                <p className="font-semibold text-sm">{submissionStatus.title}</p>
                                <p className="text-xs leading-5 text-blue-800">{submissionStatus.detail}</p>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="rounded-2xl border-0 bg-transparent p-0 shadow-none sm:border sm:border-slate-200 sm:bg-white sm:p-5 md:p-6 sm:shadow-sm">
                    {activeStep.content}
                </div>

                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur shadow-lg sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
                    <div className="mx-auto flex max-w-3xl flex-row items-center justify-between gap-3">
                        {safeCurrentStep > 0 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onStepChange(safeCurrentStep - 1)}
                                disabled={isSubmitting}
                                className="h-11 flex-1 sm:flex-initial rounded-xl border-slate-200 px-5 font-semibold text-foreground-secondary hover:bg-slate-50 sm:w-auto"
                            >
                                Back
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    if (onCancel) {
                                        onCancel();
                                    } else {
                                        router.back();
                                    }
                                }}
                                disabled={isSubmitting}
                                className="h-11 flex-1 sm:flex-initial rounded-xl border-slate-200 px-5 font-semibold text-foreground-secondary hover:bg-slate-50 sm:w-auto"
                            >
                                Cancel
                            </Button>
                        )}

                        <Button
                            type={isFinalStep ? "submit" : "button"}
                            onClick={isFinalStep ? undefined : onNext}
                            disabled={isSubmitting}
                            className="h-11 flex-1 sm:flex-initial rounded-xl bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700 sm:w-auto"
                        >
                            {isSubmitting && isFinalStep
                                ? (wizardVariant === "registration" ? "Submitting..." : "Saving...")
                                : primaryLabel}
                        </Button>
                    </div>
                </div>

                {children}
            </form>
        </div>
    );
}
