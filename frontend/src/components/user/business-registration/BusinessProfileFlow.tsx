"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors, type UseFormReturn, type UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";

import { notify } from "@/lib/notify";
import { TOAST_MESSAGES } from "@/config/toastMessages";
import { mapErrorToMessage } from "@/lib/errorMapper";
import { injectApiErrors } from "@/lib/injectApiErrors";
import logger from "@/lib/logger";
import type { User } from "@/types/User";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import {
    getMyBusiness,
    registerBusiness,
    updateBusiness,
    uploadBusinessImage,
    type Business as UserBusiness,
    type CreateBusinessDTO,
} from "@/lib/api/user/businesses";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { BusinessProfileWizard } from "./BusinessProfileWizard";
import { getBusinessWizardFieldsForStep, useBusinessWizardBridge } from "./useBusinessWizardBridge";
import {
    businessRegistrationSchema,
    type BusinessRegistrationFormData,
    type BusinessRegistrationFormInput,
} from "@/schemas/businessRegistration.schema";
import {
    businessEditSchema,
    type BusinessEditFormData,
    type BusinessEditFormInput,
} from "@/schemas/businessEditPayload.schema";

type BusinessProfileFlowMode = "registration" | "edit";
type BusinessProfileWizardVariant = "registration" | "application-edit" | "live-edit";

interface BusinessProfileFlowProps {
    mode: BusinessProfileFlowMode;
    user: User | null;
    initialBusiness?: UserBusiness | null;
    onRefreshUser?: () => void | Promise<void>;
    onComplete?: () => void;
    onClose?: () => void;
}

type BusinessWizardFormShape = {
    businessTypes: string[];
    businessName: string;
    businessDescription: string;
    shopNo: string;
    street: string;
    landmark?: string | null;
    city: string;
    state: string;
    pincode: string;
    coordinates?: unknown;
    contactNumber: string;
    email: string;
};

function buildBusinessPayloadBase(data: BusinessWizardFormShape): Omit<CreateBusinessDTO, "images" | "documents"> {
    return {
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
            coordinates: (data.coordinates as CreateBusinessDTO["location"]["coordinates"]) || undefined,
        },
        phone: data.contactNumber.replace(/\D/g, "").slice(-10),
        email: data.email.trim(),
    };
}

function mapBusinessToEditDefaults(business: UserBusiness): BusinessEditFormInput {
    return {
        businessTypes: business.businessTypes || [],
        businessName: business.businessName || business.name || "",
        businessDescription: business.description || "",
        contactNumber: business.contactNumber || business.mobile || "",
        email: business.email || "",
        shopNo: business.location.shopNo || "",
        street: business.location.street || "",
        city: business.location.city || "",
        state: business.location.state || "",
        pincode: business.location.pincode || "",
        landmark: business.location.landmark || "",
        coordinates: business.location.coordinates || null,
        shopImages: business.images || [],
        idProof: business.documents?.idProof?.[0] || null,
        businessProof: business.documents?.businessProof?.[0] || null,
        certificates: business.documents?.certificates || [],
        idProofType: "aadhaar",
    };
}

function getBusinessEditVariant(status: UserBusiness["status"] | undefined): BusinessProfileWizardVariant {
    return normalizeBusinessStatus(status, "pending") === "live" ? "live-edit" : "application-edit";
}

function useBusinessProfileWizardController<TFormData extends Record<string, unknown>>(
    form: UseFormReturn<any, any, TFormData>,
    options: { requireDocuments: boolean },
) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formError, setFormError] = useState<string | null>(null);
    const {
        trigger,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = form;

    const formData = watch() as TFormData;
    const { legacyFormData, setLegacyFormData } = useBusinessWizardBridge({
        formData,
        errors: errors as FieldErrors<TFormData>,
        setValue: setValue as UseFormSetValue<TFormData>,
    });

    const handleNext = async () => {
        if (formError) setFormError(null);

        const isValid = await trigger(
            getBusinessWizardFieldsForStep(currentStep, { requireDocuments: options.requireDocuments }) as string[],
        );
        if (!isValid) return;

        setCurrentStep((previous) => previous + 1);
    };

    return {
        currentStep,
        setCurrentStep,
        formError,
        setFormError,
        isSubmitting,
        legacyFormData,
        setLegacyFormData,
        handleNext,
    };
}

async function processStagedFiles(items: Array<File | string>) {
    const results: string[] = [];
    for (const item of items) {
        if (!(item instanceof File)) {
            results.push(item);
            continue;
        }

        const isDocument = item.type === "application/pdf";
        results.push(await uploadBusinessImage(item, isDocument ? "documents" : "businesses"));
    }
    return results;
}

function BusinessRegistrationFlow({
    user,
    initialBusiness: _initialBusiness,
    onRefreshUser,
    onComplete,
    onClose,
}: Omit<BusinessProfileFlowProps, "mode">) {
    const router = useRouter();
    const normalizedContactNumber = (user?.mobile || "").replace(/\D/g, "").slice(-10);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const form = useForm<BusinessRegistrationFormInput, any, BusinessRegistrationFormData>({
        resolver: zodResolver(businessRegistrationSchema),
        mode: "onBlur",
        reValidateMode: "onChange",
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
        },
    });

    const wizard = useBusinessProfileWizardController<BusinessRegistrationFormData>(form, {
        requireDocuments: true,
    });

    const handleClose = () => {
        if (onClose) {
            onClose();
            return;
        }

        void router.push("/");
    };

    const onValidSubmit = async (data: BusinessRegistrationFormData) => {
        wizard.setFormError(null);

        try {
            const images = await processStagedFiles(data.shopImages);
            const idProof = data.idProof ? await processStagedFiles([data.idProof]) : [];
            const businessProof = data.businessProof ? await processStagedFiles([data.businessProof]) : [];
            const certificates = await processStagedFiles(data.certificates ?? []);

            const payload: CreateBusinessDTO = {
                ...buildBusinessPayloadBase(data),
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

            setShowSuccessDialog(true);
        } catch (error: unknown) {
            wizard.setFormError(mapErrorToMessage(error, "Failed to submit business registration."));
        }
    };

    const handleSuccessAcknowledge = async () => {
        setShowSuccessDialog(false);
        await onRefreshUser?.();
        window.dispatchEvent(new CustomEvent("esparex_auth_update"));

        if (onComplete) {
            onComplete();
            return;
        }

        void router.push("/account/business");
    };

    return (
        <BusinessProfileWizard
            headerVariant="registration"
            wizardVariant="registration"
            title="Register Business"
            user={user}
            currentStep={wizard.currentStep}
            formData={wizard.legacyFormData}
            setFormData={wizard.setLegacyFormData}
            formError={wizard.formError}
            isSubmitting={wizard.isSubmitting}
            submitLabel="Submit Application"
            onNext={wizard.handleNext}
            onHeaderBack={handleClose}
            onStepChange={wizard.setCurrentStep}
            onSubmit={form.handleSubmit(onValidSubmit)}
        >
            <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <AlertDialogContent className="max-w-md rounded-2xl border-0 p-8 shadow-2xl">
                    <div className="flex flex-col items-center space-y-6 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-50 shadow-inner animate-in zoom-in duration-500">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <AlertDialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
                                Application Submitted!
                            </AlertDialogTitle>
                            <AlertDialogDescription className="leading-relaxed text-slate-500">
                                Your business verification request has been received. Our team will review your documents and verify your account within 24-48 hours.
                            </AlertDialogDescription>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-50">
                            <div className="h-full w-1/3 animate-[progress_2s_ease-in-out_infinite] bg-emerald-500" />
                        </div>
                        <AlertDialogFooter className="w-full gap-3 sm:flex-col">
                            <AlertDialogAction
                                onClick={() => void handleSuccessAcknowledge()}
                                className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800"
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

function BusinessEditProfileFlow({
    user,
    initialBusiness,
    onRefreshUser,
    onComplete,
    onClose,
}: Omit<BusinessProfileFlowProps, "mode">) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(() => !initialBusiness);
    const [businessId, setBusinessId] = useState<string | null>(initialBusiness?.id ?? null);
    const [loadedBusiness, setLoadedBusiness] = useState<UserBusiness | null>(initialBusiness ?? null);
    const initialEditDefaults: BusinessEditFormInput = initialBusiness
        ? mapBusinessToEditDefaults(initialBusiness)
        : {
            businessTypes: [],
            businessName: "",
            businessDescription: "",
            shopNo: "",
            street: "",
            landmark: "",
            city: "",
            state: "",
            pincode: "",
            coordinates: null,
            contactNumber: "",
            email: "",
            idProofType: "aadhaar",
            idProof: null,
            businessProof: null,
            certificates: [],
            shopImages: [],
        };

    const form = useForm<BusinessEditFormInput, any, BusinessEditFormData>({
        resolver: zodResolver(businessEditSchema),
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: initialEditDefaults,
    });

    const wizard = useBusinessProfileWizardController<BusinessEditFormData>(form, {
        requireDocuments: false,
    });
    const { setFormError } = wizard;
    const wizardVariant = getBusinessEditVariant(loadedBusiness?.status);
    const normalizedBusinessStatus = normalizeBusinessStatus(loadedBusiness?.status, "pending");
    const editTitle =
        wizardVariant === "live-edit"
            ? "Edit Business Profile"
            : normalizedBusinessStatus === "rejected"
                ? "Review & Resubmit Application"
                : "Update Business Application";
    const submitLabel =
        wizardVariant === "live-edit"
            ? "Save Changes"
            : normalizedBusinessStatus === "rejected"
                ? "Save & Resubmit"
                : "Update Application";

    useEffect(() => {
        const hydrateBusiness = (business: UserBusiness) => {
            setLoadedBusiness(business);
            setBusinessId(business.id);
            form.reset(mapBusinessToEditDefaults(business));
            setIsLoading(false);
        };

        async function loadBusiness() {
            try {
                if (initialBusiness) {
                    setIsLoading(false);
                    return;
                }

                if (loadedBusiness && businessId) {
                    setIsLoading(false);
                    return;
                }

                const business = await getMyBusiness();
                if (!business) {
                    setFormError("No business profile found.");
                    void router.push("/account/business/apply");
                    return;
                }

                hydrateBusiness(business);
            } catch (error) {
                logger.error("Failed to load business details", error);
                setFormError(TOAST_MESSAGES.LOAD_FAILED);
            } finally {
                setIsLoading(false);
            }
        }

        void loadBusiness();
    }, [businessId, form, initialBusiness, loadedBusiness, router, setFormError]);

    const onValidSubmit = async (data: BusinessEditFormData) => {
        if (!businessId) return;

        wizard.setFormError(null);

        try {
            const images = await processStagedFiles((data.shopImages ?? []) as Array<File | string>);
            const idProof = data.idProof ? await processStagedFiles([data.idProof as File | string]) : [];
            const businessProof = data.businessProof ? await processStagedFiles([data.businessProof as File | string]) : [];
            const certificates = await processStagedFiles((data.certificates ?? []) as Array<File | string>);

            const payload: Partial<CreateBusinessDTO> = {
                ...buildBusinessPayloadBase(data),
                images,
                documents: {
                    idProof,
                    businessProof,
                    certificates,
                },
            };

            const updated = await updateBusiness(businessId, payload);
            if (!updated) {
                throw new Error("Update failed");
            }

            setLoadedBusiness(updated);

            if (normalizeBusinessStatus(updated.status, "pending") === "pending") {
                notify.success(
                    wizardVariant === "live-edit"
                        ? "Changes saved. Sensitive updates sent your business back for admin review."
                        : "Application updated. It remains under admin review.",
                );
            } else {
                notify.success(TOAST_MESSAGES.UPDATE_SUCCESS);
            }

            await onRefreshUser?.();
            window.dispatchEvent(new CustomEvent("esparex_auth_update"));

            if (onComplete) {
                onComplete();
                return;
            }

            void router.push("/account/business");
        } catch (error: unknown) {
            logger.error(error);
            const injected = injectApiErrors(form as any, error);
            if (!injected) {
                wizard.setFormError(mapErrorToMessage(error, TOAST_MESSAGES.LOAD_FAILED));
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <BusinessProfileWizard
            headerVariant="edit"
            wizardVariant={wizardVariant}
            title={editTitle}
            user={user}
            currentStep={wizard.currentStep}
            formData={wizard.legacyFormData}
            setFormData={wizard.setLegacyFormData}
            formError={wizard.formError}
            isSubmitting={wizard.isSubmitting}
            submitLabel={submitLabel}
            onNext={wizard.handleNext}
            onHeaderBack={() => {
                if (onClose) {
                    onClose();
                    return;
                }
                void router.push("/account/business");
            }}
            onStepChange={wizard.setCurrentStep}
            onSubmit={form.handleSubmit(onValidSubmit)}
        />
    );
}

export function BusinessProfileFlow(props: BusinessProfileFlowProps) {
    if (props.mode === "registration") {
        return <BusinessRegistrationFlow {...props} />;
    }

    return <BusinessEditProfileFlow {...props} />;
}
