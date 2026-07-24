"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@esparex/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { mapErrorToMessage } from "@/lib/errorMapper";
import { registerBusiness, type CreateBusinessDTO } from "@/lib/api/user/businesses";

import { BusinessProfileWizard } from "../BusinessProfileWizard";
import { businessRegistrationSchema, type BusinessRegistrationFormData, type BusinessRegistrationFormInput } from "@/schemas/businessRegistration.schema";
import type { User } from "@/types/User";
import type { SubmissionStatus } from "./types";
import { buildBusinessPayloadBase, mapBusinessToCreateDefaults } from "./helpers";
import { processStagedFiles } from "./upload";

import { useProfileWizardController } from "./hooks";

export function BusinessRegistrationFlow({ user, onRefreshUser, onComplete, onClose }: {
    user: User | null; onRefreshUser?: () => void | Promise<void>; onComplete?: () => void; onClose?: () => void;
}) {
    const router = useRouter();
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
    const defaults = mapBusinessToCreateDefaults(user || {});
    const form = useForm<BusinessRegistrationFormInput, undefined, BusinessRegistrationFormData>({
        resolver: zodResolver(businessRegistrationSchema), mode: "onBlur", reValidateMode: "onChange",
        defaultValues: { ...defaults, idProof: null, businessProof: null, certificates: [], images: [], idProofType: undefined },
    });
    const wizard = useProfileWizardController<BusinessRegistrationFormInput>(form, { requireDocuments: true });
    const handleClose = () => { if (onClose) { onClose(); return; } void router.push("/"); };

    const onValidSubmit = async (data: BusinessRegistrationFormData) => {
        wizard.setFormError(null);
        setSubmissionStatus({ title: "Preparing application", detail: "Checking files and details before secure upload." });
        try {
            const images = await processStagedFiles(data.images, { label: "Uploading shop photos", onProgress: setSubmissionStatus });
            const idProof = data.idProof ? await processStagedFiles([data.idProof], { label: "Uploading owner ID proof", onProgress: setSubmissionStatus }) : [];
            const businessProof = data.businessProof ? await processStagedFiles([data.businessProof], { label: "Uploading business proof", onProgress: setSubmissionStatus }) : [];
            const certificates = await processStagedFiles(data.certificates ?? [], { label: "Uploading supporting certificates", onProgress: setSubmissionStatus });
            const payload: CreateBusinessDTO = { ...buildBusinessPayloadBase(data), images, documents: { idProof, idProofType: data.idProofType, businessProof, certificates } };
            setSubmissionStatus({ title: "Submitting application", detail: "Sending your business details and verification documents to the review team." });
            const created = await registerBusiness(payload);
            if (!created) throw new Error("Business registration failed.");
            setSubmissionStatus(null);
            setShowSuccessDialog(true);
        } catch (error: unknown) {
            setSubmissionStatus(null);
            wizard.setFormError(mapErrorToMessage(error, "Failed to submit business registration."));
        }
    };

    const handleSuccessAcknowledge = async () => {
        setShowSuccessDialog(false);
        await onRefreshUser?.();
        window.dispatchEvent(new CustomEvent("esparex_auth_update"));
        if (onComplete) { onComplete(); return; }
        void router.push("/account/business");
    };

    return (
        <BusinessProfileWizard wizardVariant="registration" title="Register Business" user={user}
            currentStep={wizard.currentStep} formData={wizard.legacyFormData} setFormData={wizard.setLegacyFormData}
            formError={wizard.formError} submissionStatus={submissionStatus} isSubmitting={wizard.isSubmitting}
            submitLabel="Submit Application" onNext={wizard.handleNext} onHeaderBack={handleClose}
            onStepChange={wizard.setCurrentStep} onSubmit={form.handleSubmit(onValidSubmit)}>
            <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <AlertDialogContent className="max-w-md rounded-2xl border-0 p-8 shadow-2xl">
                    <div className="flex flex-col items-center space-y-6 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-50 shadow-inner animate-in zoom-in duration-500">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <AlertDialogTitle className="text-2xl font-bold tracking-tight text-foreground">Application Submitted!</AlertDialogTitle>
                            <AlertDialogDescription className="leading-relaxed text-muted-foreground">Your business verification request has been received. Our team will review your documents and verify your account within 24-48 hours.</AlertDialogDescription>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-50"><div className="h-full w-1/3 animate-[progress_2s_ease-in-out_infinite] bg-emerald-500" /></div>
                        <AlertDialogFooter className="w-full gap-3 sm:flex-col">
                            <AlertDialogAction onClick={() => void handleSuccessAcknowledge()} className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800">Got it, thanks!</AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </BusinessProfileWizard>
    );
}
