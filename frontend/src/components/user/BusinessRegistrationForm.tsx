"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { registerBusiness, uploadBusinessImage, type CreateBusinessDTO } from "@/lib/api/user/businesses";
import { mapErrorToMessage } from "@/lib/errorMapper";
import type { User } from "@/types/User";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { BusinessProfileWizard } from "./business-registration/BusinessProfileWizard";
import { getBusinessWizardFieldsForStep, useBusinessWizardBridge } from "./business-registration/useBusinessWizardBridge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { businessRegistrationSchema, type BusinessRegistrationFormData, type BusinessRegistrationFormInput } from "@/schemas/businessRegistration.schema";

interface BusinessRegistrationFormProps {
    user?: User | null;
    onUpdateUser?: (user?: User) => void | Promise<void>;
    navigateTo?: (page: string) => void;
    onSuccess?: () => void;
    onClose?: () => void;
}

export function BusinessRegistrationForm({
    user = null,
    onUpdateUser,
    navigateTo,
    onSuccess,
    onClose
}: BusinessRegistrationFormProps) {
    const router = useRouter();
    const normalizedContactNumber = (user?.mobile || "").replace(/\D/g, "").slice(-10);

    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const form = useForm<BusinessRegistrationFormInput, any, BusinessRegistrationFormData>({
        resolver: zodResolver(businessRegistrationSchema),
        mode: "onBlur", // Only validate when user leaves field - not while typing
        reValidateMode: "onChange", // Re-validate after correction while typing
        defaultValues: {
            businessTypes: ["repair", "spare-parts"],
            businessName: "",
            businessDescription: "",
            shopNo: "",
            street: "",
            landmark: "",
            city: "",
            state: "",
            pincode: "",
            coordinates: null,
            contactNumber: normalizedContactNumber,
            email: user?.email || "",
            idProof: null,
            businessProof: null,
            certificates: [],
            shopImages: [],
            idProofType: "aadhaar",
        }
    });

    const { handleSubmit, trigger, watch, setValue, formState: { errors } } = form;
    const formData = watch();
    const { legacyFormData, setLegacyFormData } = useBusinessWizardBridge({
        formData,
        errors,
        setValue,
    });

    const validateStep = async () => {
        return trigger(
            getBusinessWizardFieldsForStep(currentStep, { requireDocuments: true }) as Array<keyof BusinessRegistrationFormData>,
        );
    };

    const handleNext = async () => {
        if (formError) setFormError(null);
        const isValid = await validateStep();
        if (!isValid) return;

        setCurrentStep((prev) => prev + 1);
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
            return;
        }
        if (navigateTo) {
            navigateTo("home");
            return;
        }
        void router.push("/");
    };

    const processMixedFiles = async (items: Array<File | string>) => {
        const results: string[] = [];
        for (const item of items) {
            if (!(item instanceof File)) {
                results.push(item);
            } else {
                const isDocument = item.type === 'application/pdf';
                // Sequential await prevents burst-triggering the mutationLimiter
                results.push(await uploadBusinessImage(item, isDocument ? 'documents' : 'businesses'));
            }
        }
        return results;
    };

    const onValidSubmit = async (data: BusinessRegistrationFormData) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setFormError(null);

        try {
            const images = await processMixedFiles(data.shopImages);
            const idProof = data.idProof ? await processMixedFiles([data.idProof]) : [];
            const businessProof = data.businessProof ? await processMixedFiles([data.businessProof]) : [];
            const certificates = await processMixedFiles(data.certificates ?? []);

            const payload: CreateBusinessDTO = {
                name: data.businessName.trim(),
                description: data.businessDescription.trim(),
                businessTypes: data.businessTypes,
                location: {
                    city: data.city.trim(),
                    state: data.state.trim(),
                    pincode: data.pincode.trim(),
                    street: data.street.trim(),
                    shopNo: data.shopNo.trim(),
                    landmark: data.landmark?.trim() || undefined,
                    coordinates: data.coordinates || undefined,
                },
                phone: data.contactNumber.replace(/\D/g, "").slice(-10),
                email: data.email.trim(),
                images,
                documents: {
                    idProof,
                    idProofType: data.idProofType,
                    businessProof,
                    certificates,
                },
            };

            const created = await registerBusiness(payload);
            if (!created) {
                throw new Error("Business registration failed.");
            }

            // Show dialog FIRST — calling onUpdateUser before this causes the
            // page useEffect to detect hasPendingApplication and redirect,
            // unmounting this component before the dialog can render.
            setShowSuccessDialog(true);
        } catch (error: unknown) {
            setFormError(mapErrorToMessage(error, "Failed to submit business registration."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const onSubmit = handleSubmit(onValidSubmit as unknown as Parameters<typeof handleSubmit>[0]);

    return (
        <BusinessProfileWizard
            headerVariant="registration"
            title="Register Business"
            user={user}
            currentStep={currentStep}
            formData={legacyFormData}
            setFormData={setLegacyFormData}
            formError={formError}
            isSubmitting={isSubmitting}
            submitLabel="Submit Application"
            onNext={handleNext}
            onHeaderBack={handleClose}
            onStepChange={setCurrentStep}
            onSubmit={onSubmit}
        >
            <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <AlertDialogContent className="max-w-md rounded-2xl p-8 border-0 shadow-2xl">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center border-4 border-emerald-100 shadow-inner animate-in zoom-in duration-500">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <AlertDialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">Application Submitted!</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 leading-relaxed">
                                Your business verification request has been received. Our team will review your documents and verify your account within 24-48 hours.
                            </AlertDialogDescription>
                        </div>
                        <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-1/3 animate-[progress_2s_ease-in-out_infinite]" />
                        </div>
                        <AlertDialogFooter className="w-full sm:flex-col gap-3">
                            <AlertDialogAction 
                                onClick={async () => {
                                    setShowSuccessDialog(false);
                                    if (onUpdateUser) {
                                        await onUpdateUser();
                                    }

                                    window.dispatchEvent(CustomEvent ? new CustomEvent("esparex_auth_update") : new Event("esparex_auth_update"));

                                    if (onSuccess) {
                                        onSuccess();
                                        return;
                                    }
                                    void router.push("/account/business");
                                }}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-slate-200"
                            >
                                Got it, thanks!
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </BusinessProfileWizard>
    );
}
