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

import { fileToBase64 } from "./business-registration/utils";
import { BusinessProfileWizard } from "./business-registration/BusinessProfileWizard";
import { getBusinessWizardFieldsForStep, useBusinessWizardBridge } from "./business-registration/useBusinessWizardBridge";
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
    const { legacyFormData, setLegacyFormData } = useBusinessWizardBridge({
        formData,
        errors,
        setValue,
    });

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
        return trigger(
            getBusinessWizardFieldsForStep(currentStep, { requireDocuments: false }) as Array<keyof BusinessEditFormData>,
        );
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
        <BusinessProfileWizard
            headerVariant="edit"
            title="Edit Business Profile"
            user={user}
            currentStep={currentStep}
            formData={legacyFormData}
            setFormData={setLegacyFormData}
            formError={formError}
            isSubmitting={isSubmitting}
            submitLabel="Save Changes"
            onNext={handleNext}
            onHeaderBack={() => {
                void router.push("/account/business");
            }}
            onStepChange={setCurrentStep}
            onSubmit={handleSubmit(onValidSubmit as unknown as Parameters<typeof handleSubmit>[0])}
        />
    );
}
