"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { TOAST_MESSAGES } from "@/constants/toastMessages";
import { useRouter } from "next/navigation";
import { mapErrorToMessage } from "@/utils/errorMapper";

import { User } from "@/types/User";
import { getMyBusiness, updateBusiness, CreateBusinessDTO } from "@/api/user/businesses";

import { Button } from "../ui/button";
import {
    ArrowLeft,
} from "@/icons/IconRegistry";
import { FormError } from "@/components/ui/FormError";

import { StepData, initialStepData } from "./business-registration/types";
import { fileToBase64 } from "./business-registration/utils";
import { StepBasicDetails } from "./business-registration/StepBasicDetails";
import { StepAddress } from "./business-registration/StepAddress";
import { StepDocuments } from "./business-registration/StepDocuments";
import { StepReview } from "./business-registration/StepReview";
import logger from "@/lib/logger";

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
    const [formData, setFormData] = useState<StepData>(initialStepData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

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

                // Map API Data to StepData
                setFormData({
                    businessTypes: business.businessTypes || [],
                    deviceCategories: [],
                    businessName: business.businessName || "",
                    businessDescription: business.description || "",
                    contactNumber: business.contactNumber || "",
                    email: business.email || "",

                    // Address
                    shopNo: business.location.shopNo || "",
                    street: business.location.street || "",
                    city: business.location.city || "",
                    state: business.location.state || "",
                    pincode: business.location.pincode || "",
                    landmark: business.location.landmark || "",
                    coordinates: business.location.coordinates || null,

                    // Images (Already URLs)
                    shopImages: business.images || [],

                    // Docs (Already URLs)
                    idProof: (business.documents?.idProof && business.documents.idProof.length > 0) ? business.documents.idProof[0]! : null,
                    businessProof: (business.documents?.businessProof && business.documents.businessProof.length > 0) ? business.documents.businessProof[0]! : null,
                    certificates: business.documents?.certificates || []
                });

            } catch (error) {
                logger.error("Failed to load business details", error);
                setFormError(TOAST_MESSAGES.LOAD_FAILED);
            } finally {
                setIsLoading(false);
            }
        }

        loadBusiness();
    }, [router]);

    /* -------------------------------------------------------------------------- */
    /* Validation                                                                 */
    /* -------------------------------------------------------------------------- */

    const validateStep = (step: number): boolean => {
        // Step indices match the rendered StepXxx components:
        // 0 = StepBasicDetails, 1 = StepAddress, 2 = StepDocuments, 3 = StepReview

        if (step === 0 && (!formData.businessName || !formData.businessDescription || !formData.contactNumber || !formData.email)) {
            notify.error("Please fill in all required basic details");
            return false;
        }
        if (
            step === 1 &&
            (!formData.shopNo ||
                !formData.street ||
                !formData.city ||
                !formData.state ||
                !formData.pincode)
        ) {
            setFormError("Complete address details.");
            return false;
        }
        if (step === 2 && (!formData.idProof || !formData.businessProof)) {
            setFormError("Upload required documents.");
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (formError) setFormError(null);
        if (!validateStep(currentStep)) return;
        setCurrentStep((s) => s + 1);
    };

    /* -------------------------------------------------------------------------- */
    /* Submit                                                                     */
    /* -------------------------------------------------------------------------- */

    const handleSubmit = async () => {
        if (isSubmitting || !businessId) return;
        setFormError(null);
        setIsSubmitting(true);

        try {
            // Helper to process mixed (File | string) arrays
            // If it's a File, convert to Base64. If it's a string (URL), keep as is.
            const processMixedImages = async (items: (File | string)[]) => {
                return await Promise.all(items.map(item =>
                    item instanceof File ? fileToBase64(item) : item
                ));
            };

            const images = await processMixedImages(formData.shopImages);

            // Docs
            const idProofList = formData.idProof ? [formData.idProof] : [];
            const busProofList = formData.businessProof ? [formData.businessProof] : [];

            const idProofProcessed = await processMixedImages(idProofList);
            const busProofProcessed = await processMixedImages(busProofList);
            const certsProcessed = await processMixedImages(formData.certificates);

            const payload: Partial<CreateBusinessDTO> = {
                name: formData.businessName,
                description: formData.businessDescription,
                businessTypes: formData.businessTypes,

                location: {
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                    street: formData.street,
                    shopNo: formData.shopNo,
                    landmark: formData.landmark,
                    coordinates: formData.coordinates || undefined,
                },
                phone: formData.contactNumber,
                email: formData.email,

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

            // If critical fields changed the backend resets status to PENDING for re-review
            if (updated.status === 'pending') {
                notify.success("Changes saved. Your profile is under admin review again.");
            } else {
                notify.success(TOAST_MESSAGES.UPDATE_SUCCESS);
            }

            // Trigger session refresh to sync businessStatus in sidebar/navigation
            window.dispatchEvent(new CustomEvent("esparex_auth_update"));

            if (onComplete) {
                onComplete();
            } else {

                void router.push('/account/business');
            }

        } catch (e: unknown) {
            logger.error(e);
            setFormError(mapErrorToMessage(e, TOAST_MESSAGES.LOAD_FAILED));
        } finally {
            setIsSubmitting(false);
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

            <form className="max-w-4xl mx-auto px-4 space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <FormError message={formError} className="mb-2" />

                <StepBasicDetails
                    formData={formData}
                    setFormData={setFormData}
                    user={user}
                    onNext={handleNext}
                    onBack={() => void router.push('/account/business')}
                    isActive={currentStep === 0}
                    isCompleted={currentStep > 0}
                    onEdit={() => setCurrentStep(0)}
                />

                <StepAddress
                    formData={formData}
                    setFormData={setFormData}
                    onNext={handleNext}
                    onBack={() => setCurrentStep(0)}
                    isActive={currentStep === 1}
                    isCompleted={currentStep > 1}
                    onEdit={() => setCurrentStep(1)}
                />

                <StepDocuments
                    formData={formData}
                    setFormData={setFormData}
                    onNext={handleNext}
                    onBack={() => setCurrentStep(1)}
                    isActive={currentStep === 2}
                    isCompleted={currentStep > 2}
                    onEdit={() => setCurrentStep(2)}
                />

                <StepReview
                    formData={formData}
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
