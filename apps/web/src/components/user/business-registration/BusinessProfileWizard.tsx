"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "@esparex/ui";
import type { User } from "@esparex/contracts";
import { Button } from "@esparex/ui";
import { FormError } from "@esparex/ui";
import { scrollToFirstError } from "@/lib/formHelpers";
import {
    ListingModalLayout,
    ListingModalBody,
    ListingModalFooter,
} from "@/components/user/shared/ListingModalLayout";
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
    onHeaderBack,
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
                <div className="flex flex-col gap-4">
                    <StepBasicDetails
                        formData={formData}
                        setFormData={setFormData}
                        user={user}
                    />
                    <div className="border-t border-border/60 pt-4">
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
        : "Next";

    const headingRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            headingRef.current?.focus();
        }
    }, [safeCurrentStep]);

    const handleClose = () => {
        if (onCancel) {
            onCancel();
        } else if (onHeaderBack) {
            onHeaderBack();
        } else {
            router.back();
        }
    };

    return (
        <ListingModalLayout
            title={title}
            onClose={handleClose}
            className="sm:max-w-2xl md:max-w-3xl"
        >
            <form
                id="business-profile-wizard-form"
                className="flex flex-col flex-1 min-h-0"
                onSubmit={(e) => {
                    onSubmit(e);
                    if (formError) {
                        scrollToFirstError();
                    }
                }}
                noValidate
            >
                {/* Step progress indicators */}
                <div className="shrink-0 px-4 pt-3 sm:px-6 sm:pt-4 flex items-center justify-between border-b border-border/40 pb-2.5" aria-hidden="true">
                    <span className="text-caption font-semibold uppercase tracking-wider text-primary">
                        Step {safeCurrentStep + 1} of {steps.length} • {activeStep.label}
                    </span>
                    <div className="flex gap-1.5">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    idx === safeCurrentStep
                                        ? "w-8 bg-primary"
                                        : idx < safeCurrentStep
                                            ? "w-4 bg-emerald-500"
                                            : "w-4 bg-border"
                                }`}
                            />
                        ))}
                    </div>
                </div>

                <ListingModalBody id="business-wizard-body" className="space-y-3.5">
                    <div role="alert" aria-live="polite">
                        <FormError message={formError} className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-caption text-destructive" />
                    </div>
                    {submissionStatus ? (
                        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-caption text-foreground" role="status" aria-live="polite">
                            <div className="flex items-start gap-3">
                                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                                <div className="flex flex-col gap-0.5">
                                    <p className="font-semibold text-caption">{submissionStatus.title}</p>
                                    <p className="text-tiny leading-5 text-foreground-secondary">{submissionStatus.detail}</p>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div>
                        <h2 ref={headingRef} tabIndex={-1} className="sr-only">
                            {activeStep.title}
                        </h2>
                        {activeStep.content}
                    </div>
                </ListingModalBody>

                <ListingModalFooter>
                    <div className="flex items-center justify-between gap-3 w-full">
                        {safeCurrentStep > 0 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onStepChange(safeCurrentStep - 1)}
                                disabled={isSubmitting}
                                className="h-11 flex-1 sm:flex-initial rounded-xl border-border px-5 font-semibold text-foreground-secondary hover:bg-muted sm:w-auto cursor-pointer"
                            >
                                Back
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="h-11 flex-1 sm:flex-initial rounded-xl border-border px-5 font-semibold text-foreground-secondary hover:bg-muted sm:w-auto cursor-pointer"
                            >
                                Cancel
                            </Button>
                        )}

                        <Button
                            type={isFinalStep ? "submit" : "button"}
                            onClick={isFinalStep ? undefined : onNext}
                            disabled={isSubmitting}
                            className="h-11 flex-1 sm:flex-initial rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto cursor-pointer"
                        >
                            {isSubmitting && isFinalStep
                                ? (wizardVariant === "registration" ? "Submitting..." : "Saving...")
                                : primaryLabel}
                        </Button>
                    </div>
                </ListingModalFooter>
            </form>

            {children}
        </ListingModalLayout>
    );
}
