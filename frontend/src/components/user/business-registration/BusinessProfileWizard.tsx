"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { User } from "@/types/User";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/FormError";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StepBasicDetails } from "./StepBasicDetails";
import { StepAddress } from "./StepAddress";
import { StepDocuments } from "./StepDocuments";
import { ShopPhotosField } from "./ShopPhotosField";
import { StepReview } from "./StepReview";
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
    children,
}: BusinessProfileWizardProps) {
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
                <div className="space-y-6">
                    <ShopPhotosField
                        formData={formData}
                        setFormData={setFormData}
                        helperText="Upload the workspace photos reviewers expect to see before they approve the business."
                    />
                    {showDocumentsStep ? (
                        <div className="border-t border-slate-100 pt-6">
                            <StepDocuments
                                formData={formData}
                                setFormData={setFormData}
                                variant={wizardVariant === "registration" ? "registration" : "application-edit"}
                            />
                        </div>
                    ) : null}
                    <div className="border-t border-slate-100 pt-6">
                        <Accordion type="single" collapsible className="rounded-2xl border border-slate-200 bg-slate-50 px-4">
                            <AccordionItem value="review" className="border-b-0">
                                <AccordionTrigger className="py-4 text-sm font-semibold text-slate-900 hover:no-underline">
                                    Review everything before you submit
                                </AccordionTrigger>
                                <AccordionContent className="pb-1">
                                    <StepReview
                                        formData={formData}
                                        onEditStep={onStepChange}
                                        variant={wizardVariant}
                                        showDocumentsSummary={showDocumentsStep}
                                        detailsStepIndex={0}
                                        documentsStepIndex={1}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
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

    return (
        <div className="bg-slate-50 py-6 md:py-8">
            <form
                className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pb-28 md:pb-0"
                onSubmit={onSubmit}
                noValidate
            >
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:px-5">
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onHeaderBack}
                            className="h-11 rounded-full px-3 text-slate-600 hover:bg-slate-100"
                        >
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            {wizardVariant === "registration" ? "Exit setup" : "Close"}
                        </Button>

                        <h1 className="truncate text-base font-semibold text-slate-900 md:text-lg">
                            {title}
                        </h1>
                    </div>
                </div>

                <FormError message={formError} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" />
                {submissionStatus ? (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                        <div className="flex items-start gap-3">
                            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                            <div className="space-y-1">
                                <p className="font-semibold">{submissionStatus.title}</p>
                                <p className="leading-6 text-blue-800">{submissionStatus.detail}</p>
                            </div>
                        </div>
                    </div>
                ) : null}

                <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-5 md:px-8 md:py-6">
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                            {activeStep.title}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                            {activeStep.description}
                        </p>
                    </div>
                    <div className="px-5 py-5 md:px-8 md:py-8">{activeStep.content}</div>
                </section>

                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
                    <div className="mx-auto flex max-w-4xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            {safeCurrentStep > 0 ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onStepChange(safeCurrentStep - 1)}
                                    disabled={isSubmitting}
                                    className="h-11 w-full rounded-xl border-slate-200 px-6 sm:w-auto"
                                >
                                    Back
                                </Button>
                            ) : null}
                        </div>

                        <Button
                            type={isFinalStep ? "submit" : "button"}
                            onClick={isFinalStep ? undefined : onNext}
                            disabled={isSubmitting}
                            className="h-11 w-full rounded-xl bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700 sm:w-auto"
                        >
                            {isSubmitting && isFinalStep
                                ? (wizardVariant === "registration" ? "Submitting application..." : "Saving business profile...")
                                : primaryLabel}
                        </Button>
                    </div>
                </div>

                {children}
            </form>
        </div>
    );
}
