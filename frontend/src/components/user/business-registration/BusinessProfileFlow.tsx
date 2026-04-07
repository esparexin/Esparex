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
type SubmissionStatus = {
    title: string;
    detail: string;
};

interface BusinessProfileFlowProps {
    mode: BusinessProfileFlowMode;
    user: User | null;
    initialBusiness?: UserBusiness | null;
    onRefreshUser?: () => void | Promise<void>;
    onComplete?: () => void;
    onClose?: () => void;
}

type BusinessWizardFormShape = {
    businessName: string;
    businessDescription: string;
    fullAddress: string;
    currentLocationDisplay: string;
    currentLocationSource?: "auto" | "";
    currentLocationCity?: string | null;
    currentLocationState?: string | null;
    currentLocationCountry?: string | null;
    coordinates?: unknown;
    contactNumber: string;
    email: string;
};

const asOptionalString = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
};

const joinAddressParts = (...parts: unknown[]): string =>
    parts
        .map((part) => asOptionalString(part))
        .filter((part): part is string => Boolean(part))
        .join(", ");

function buildBusinessPayloadBase(data: BusinessWizardFormShape): Omit<CreateBusinessDTO, "images" | "documents"> {
    return {
        name: data.businessName.trim(),
        description: data.businessDescription.trim(),
        location: {
            address: data.fullAddress.trim(),
            display: data.currentLocationDisplay.trim(),
            ...(asOptionalString(data.currentLocationCity) ? { city: data.currentLocationCity?.trim() } : {}),
            ...(asOptionalString(data.currentLocationState) ? { state: data.currentLocationState?.trim() } : {}),
            ...(asOptionalString(data.currentLocationCountry) ? { country: data.currentLocationCountry?.trim() } : {}),
            coordinates: (data.coordinates as CreateBusinessDTO["location"]["coordinates"]) || undefined,
        },
        phone: data.contactNumber.replace(/\D/g, "").slice(-10),
        email: data.email.trim(),
    };
}

function mapBusinessToEditDefaults(business: UserBusiness): BusinessEditFormInput {
    const fullAddress =
        asOptionalString(business.location.address)
        || joinAddressParts(
            business.location.shopNo,
            business.location.street,
            business.location.landmark,
            business.location.city,
            business.location.state,
            business.location.pincode,
        );
    const currentLocationDisplay =
        asOptionalString(business.location.display)
        || asOptionalString(business.location.formattedAddress)
        || joinAddressParts(business.location.city, business.location.state)
        || fullAddress;

    return {
        businessName: business.name || "",
        businessDescription: business.description || "",
        contactNumber: business.mobile || "",
        email: business.email || "",
        fullAddress: fullAddress || "",
        currentLocationDisplay: currentLocationDisplay || "",
        currentLocationSource: "",
        currentLocationCity: business.location.city || "",
        currentLocationState: business.location.state || "",
        currentLocationCountry: business.location.country || "",
        coordinates: business.location.coordinates || null,
        shopImages: business.images || [],
        idProof: business.documents?.idProof?.[0] || null,
        businessProof: business.documents?.businessProof?.[0] || null,
        certificates: business.documents?.certificates || [],
        idProofType: business.documents?.idProofType,
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

async function processStagedFiles(
    items: Array<File | string>,
    options?: {
        label?: string;
        onProgress?: (status: SubmissionStatus) => void;
    },
) {
    const results: string[] = [];
    const totalUploadable = items.filter((item): item is File => item instanceof File).length;
    let uploadedCount = 0;

    for (const item of items) {
        if (!(item instanceof File)) {
            results.push(item);
            continue;
        }

        uploadedCount += 1;
        options?.onProgress?.({
            title: options.label || "Uploading files",
            detail: `${uploadedCount} of ${totalUploadable} file${totalUploadable === 1 ? "" : "s"} uploaded`,
        });

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
    const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);

    const form = useForm<BusinessRegistrationFormInput, any, BusinessRegistrationFormData>({
        resolver: zodResolver(businessRegistrationSchema),
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: {
            businessName: "",
            businessDescription: "",
            fullAddress: "",
            currentLocationDisplay: "",
            currentLocationSource: "",
            currentLocationCity: "",
            currentLocationState: "",
            currentLocationCountry: "",
            coordinates: null,
            contactNumber: normalizedContactNumber,
            email: user?.email || "",
            idProof: null,
            businessProof: null,
            certificates: [],
            shopImages: [],
            idProofType: undefined,
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
        setSubmissionStatus({
            title: "Preparing application",
            detail: "Checking files and details before secure upload.",
        });

        try {
            const images = await processStagedFiles(data.shopImages, {
                label: "Uploading shop photos",
                onProgress: setSubmissionStatus,
            });
            const idProof = data.idProof ? await processStagedFiles([data.idProof], {
                label: "Uploading owner ID proof",
                onProgress: setSubmissionStatus,
            }) : [];
            const businessProof = data.businessProof ? await processStagedFiles([data.businessProof], {
                label: "Uploading business proof",
                onProgress: setSubmissionStatus,
            }) : [];
            const certificates = await processStagedFiles(data.certificates ?? [], {
                label: "Uploading supporting certificates",
                onProgress: setSubmissionStatus,
            });

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

            setSubmissionStatus({
                title: "Submitting application",
                detail: "Sending your business details and verification documents to the review team.",
            });
            const created = await registerBusiness(payload);
            if (!created) {
                throw new Error("Business registration failed.");
            }

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

        if (onComplete) {
            onComplete();
            return;
        }

        void router.push("/account/business");
    };

    return (
        <BusinessProfileWizard
            wizardVariant="registration"
            title="Register Business"
            user={user}
            currentStep={wizard.currentStep}
            formData={wizard.legacyFormData}
            setFormData={wizard.setLegacyFormData}
            formError={wizard.formError}
            submissionStatus={submissionStatus}
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
                            <AlertDialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                                Application Submitted!
                            </AlertDialogTitle>
                            <AlertDialogDescription className="leading-relaxed text-muted-foreground">
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
    const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
    const initialEditDefaults: BusinessEditFormInput = initialBusiness
        ? mapBusinessToEditDefaults(initialBusiness)
        : {
            businessName: "",
            businessDescription: "",
            fullAddress: "",
            currentLocationDisplay: "",
            currentLocationSource: "",
            currentLocationCity: "",
            currentLocationState: "",
            currentLocationCountry: "",
            coordinates: null,
            contactNumber: "",
            email: "",
            idProofType: undefined,
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

                const business = await getMyBusiness({ silent: true });
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
        setSubmissionStatus({
            title: "Preparing changes",
            detail: "Checking updated files and business details before upload.",
        });

        try {
            const images = await processStagedFiles((data.shopImages ?? []) as Array<File | string>, {
                label: "Uploading shop photos",
                onProgress: setSubmissionStatus,
            });
            const idProof = data.idProof ? await processStagedFiles([data.idProof as File | string], {
                label: "Uploading owner ID proof",
                onProgress: setSubmissionStatus,
            }) : [];
            const businessProof = data.businessProof ? await processStagedFiles([data.businessProof as File | string], {
                label: "Uploading business proof",
                onProgress: setSubmissionStatus,
            }) : [];
            const certificates = await processStagedFiles((data.certificates ?? []) as Array<File | string>, {
                label: "Uploading supporting certificates",
                onProgress: setSubmissionStatus,
            });

            const payload: Partial<CreateBusinessDTO> = {
                ...buildBusinessPayloadBase(data),
                images,
                documents: {
                    idProof,
                    idProofType: data.idProofType,
                    businessProof,
                    certificates,
                },
            };

            setSubmissionStatus({
                title: "Saving business profile",
                detail: "Applying your latest business details and review documents.",
            });
            const updated = await updateBusiness(businessId, payload);
            if (!updated) {
                throw new Error("Update failed");
            }

            setLoadedBusiness(updated);
            setSubmissionStatus(null);

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
            setSubmissionStatus(null);
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
            wizardVariant={wizardVariant}
            title={editTitle}
            user={user}
            currentStep={wizard.currentStep}
            formData={wizard.legacyFormData}
            setFormData={wizard.setLegacyFormData}
            formError={wizard.formError}
            submissionStatus={submissionStatus}
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
