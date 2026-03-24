"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { notify } from "@/lib/notify";
import { TOAST_MESSAGES } from "@/config/toastMessages";
import { useRouter } from "next/navigation";
import { mapErrorToMessage } from "@/lib/errorMapper";

import { User } from "@/types/User";
import { getMyBusiness, updateBusiness, CreateBusinessDTO } from "@/lib/api/user/businesses";

import { Button } from "../ui/button";
import { ArrowLeft } from "@/icons/IconRegistry";
import { FormError } from "@/components/ui/FormError";

import { fileToBase64 } from "./business-registration/utils";
import { StepBasicDetails } from "./business-registration/StepBasicDetails";
import { StepAddress } from "./business-registration/StepAddress";
import { StepDocuments } from "./business-registration/StepDocuments";
import { StepReview } from "./business-registration/StepReview";
import logger from "@/lib/logger";
import { businessEditSchema, type BusinessEditFormData, type BusinessEditFormInput } from "@/schemas/businessEditPayload.schema";
import { injectApiErrors } from "@/lib/injectApiErrors";

interface BusinessEditFlowProps {
    user: User | null;
    onUpdateUser?: (user: User) => void;
    onComplete?: () => void;
}

export function BusinessEditFlow({
    user,
    onComplete
}: BusinessEditFlowProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const form = useForm<BusinessEditFormInput, any, BusinessEditFormData>({
        resolver: zodResolver(businessEditSchema),
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: {
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
        }
    });

    const { handleSubmit, trigger, watch, setValue, reset, formState: { errors, isSubmitting } } = form;
    const formData = watch();

    const resolveErrorMessage = (fieldError: unknown): string => {
        const err = fieldError as any;
        if (!err) return "Invalid field";
        if (typeof err.message === "string" && err.message.trim()) return err.message;
        if (typeof err?.root?.message === "string" && err.root.message.trim()) return err.root.message;
        if (Array.isArray(err)) {
            const nested = err.find((item: any) => typeof item?.message === "string" && item.message.trim());
            if (nested?.message) return nested.message;
        }
        if (err && typeof err === "object") {
            for (const value of Object.values(err)) {
                if (value && typeof (value as any).message === "string" && (value as any).message.trim()) {
                    return (value as any).message;
                }
            }
        }
        return "Invalid field";
    };

    // Bridge watch() results back to the legacy StepData shape the step components expect
    const legacyFormData = {
        ...formData,
        deviceCategories: [],
        errors: Object.keys(errors).reduce((acc, key) => {
            acc[key as keyof BusinessEditFormData] = resolveErrorMessage((errors as any)[key]);
            return acc;
        }, {} as any)
    };

    const setLegacyFormData = (updater: any) => {
        const next = typeof updater === "function" ? updater(formData) : updater;
        Object.entries(next).forEach(([key, val]) => {
            setValue(key as any, val, { shouldDirty: true });
        });
    };

    /* -------------------------------------------------------------------------- */
    /* Load Existing Data                                                         */
    /* -------------------------------------------------------------------------- */

    useEffect(() => {
        async function loadBusiness() {
            try {
                const business = await getMyBusiness();
                if (!business) {
                    setFormError("No business profile found.");
                    void router.push('/account/business/apply');
                    return;
                }

                setBusinessId(business.id);

                reset({
                    businessTypes: business.businessTypes || [],
                    businessName: business.businessName || "",
                    businessDescription: business.description || "",
                    contactNumber: business.contactNumber || "",
                    email: business.email || "",
                    shopNo: business.location.shopNo || "",
                    street: business.location.street || "",
                    city: business.location.city || "",
                    state: business.location.state || "",
                    pincode: business.location.pincode || "",
                    landmark: business.location.landmark || "",
                    coordinates: business.location.coordinates || null,
                    shopImages: business.images || [],
                    idProof: (business.documents?.idProof && business.documents.idProof.length > 0)
                        ? business.documents.idProof[0]!
                        : null,
                    businessProof: (business.documents?.businessProof && business.documents.businessProof.length > 0)
                        ? business.documents.businessProof[0]!
                        : null,
                    certificates: business.documents?.certificates || [],
                });

            } catch (error) {
                logger.error("Failed to load business details", error);
                setFormError(TOAST_MESSAGES.LOAD_FAILED);
            } finally {
                setIsLoading(false);
            }
        }

        loadBusiness();
    }, [router, reset]);

    /* -------------------------------------------------------------------------- */
    /* Step Navigation                                                            */
    /* -------------------------------------------------------------------------- */

    const validateStep = async (): Promise<boolean> => {
        let fieldsToValidate: (keyof BusinessEditFormData)[] = [];
        if (currentStep === 0) fieldsToValidate = ["businessName", "businessDescription", "contactNumber", "email", "shopImages"];
        if (currentStep === 1) fieldsToValidate = ["shopNo", "street", "city", "state", "pincode"];
        if (currentStep === 2) fieldsToValidate = []; // Documents optional on edit

        return trigger(fieldsToValidate);
    };

    const handleNext = async () => {
        if (formError) setFormError(null);
        const isValid = await validateStep();
        if (!isValid) return;
        setCurrentStep((s) => s + 1);
    };

    /* -------------------------------------------------------------------------- */
    /* Submit                                                                     */
    /* -------------------------------------------------------------------------- */

    const onValidSubmit = async (data: BusinessEditFormData) => {
        if (!businessId) return;
        setFormError(null);

        try {
            const processMixedImages = async (items: (File | string)[]) => {
                return await Promise.all(items.map(item =>
                    item instanceof File ? fileToBase64(item) : item
                ));
            };

            const images = await processMixedImages((data.shopImages ?? []) as (File | string)[]);

            const idProofList = data.idProof ? [data.idProof as File | string] : [];
            const busProofList = data.businessProof ? [data.businessProof as File | string] : [];

            const idProofProcessed = await processMixedImages(idProofList);
            const busProofProcessed = await processMixedImages(busProofList);
            const certsProcessed = await processMixedImages((data.certificates ?? []) as (File | string)[]);

            const payload: Partial<CreateBusinessDTO> = {
                name: data.businessName,
                description: data.businessDescription,
                businessTypes: data.businessTypes,
                location: {
                    city: data.city,
                    state: data.state,
                    pincode: data.pincode,
                    street: data.street,
                    shopNo: data.shopNo,
                    landmark: data.landmark || undefined,
                    coordinates: data.coordinates || undefined,
                },
                phone: data.contactNumber,
                email: data.email,
                images,
                documents: {
                    idProof: idProofProcessed,
                    businessProof: busProofProcessed,
                    certificates: certsProcessed,
                },
            };

            const updated = await updateBusiness(businessId, payload);

            if (!updated) {
                throw new Error("Update failed");
            }

            if (updated.status === 'pending') {
                notify.success("Changes saved. Your profile is under admin review again.");
            } else {
                notify.success(TOAST_MESSAGES.UPDATE_SUCCESS);
            }

            window.dispatchEvent(new CustomEvent("esparex_auth_update"));

            if (onComplete) {
                onComplete();
            } else {
                void router.push('/account/business');
            }

        } catch (e: unknown) {
            logger.error(e);
            // Inject field-level API errors into the form before falling back to banner
            const injected = injectApiErrors(form as any, e);
            if (!injected) {
                setFormError(mapErrorToMessage(e, TOAST_MESSAGES.LOAD_FAILED));
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    /* -------------------------------------------------------------------------- */
    /* Steps Render                                                               */
    /* -------------------------------------------------------------------------- */

    return (
        <div className="bg-gray-50 py-8">
            <div className="bg-white border-b mb-8">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            currentStep > 0 ? setCurrentStep(s => s - 1) : void router.push('/account/business')
                        }
                    >
                        <ArrowLeft />
                    </Button>
                    <h1 className="font-bold text-xl">Edit Business Profile</h1>
                </div>
            </div>

            <form
                className="max-w-4xl mx-auto px-4 space-y-4"
                onSubmit={handleSubmit(onValidSubmit as unknown as Parameters<typeof handleSubmit>[0])}
                noValidate
            >
                <FormError message={formError} className="mb-2" />

                <StepBasicDetails
                    formData={legacyFormData as any}
                    setFormData={setLegacyFormData}
                    user={user}
                    onNext={handleNext}
                    onBack={() => void router.push('/account/business')}
                    isActive={currentStep === 0}
                    isCompleted={currentStep > 0}
                    onEdit={() => setCurrentStep(0)}
                />

                <StepAddress
                    formData={legacyFormData as any}
                    setFormData={setLegacyFormData}
                    onNext={handleNext}
                    onBack={() => setCurrentStep(0)}
                    isActive={currentStep === 1}
                    isCompleted={currentStep > 1}
                    onEdit={() => setCurrentStep(1)}
                />

                <StepDocuments
                    formData={legacyFormData as any}
                    setFormData={setLegacyFormData}
                    onNext={handleNext}
                    onBack={() => setCurrentStep(1)}
                    isActive={currentStep === 2}
                    isCompleted={currentStep > 2}
                    onEdit={() => setCurrentStep(2)}
                />

                <StepReview
                    formData={legacyFormData as any}
                    onBack={() => setCurrentStep(2)}
                    isActive={currentStep === 3}
                    onEditStep={setCurrentStep}
                    isSubmitting={isSubmitting}
                    submitLabel="Save Changes"
                />
            </form>
        </div>
    );
}
