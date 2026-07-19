"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { notify } from "@/lib/feedback";
import { TOAST_MESSAGES } from "@/config/toastMessages";
import { mapErrorToMessage } from "@/lib/errorMapper";
import { injectApiErrors } from "@/lib/injectApiErrors";
import logger from "@/lib/logger";
import { getMyBusiness, updateBusiness, type Business as UserBusiness, type CreateBusinessDTO } from "@/lib/api/user/businesses";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { BusinessProfileWizard } from "../BusinessProfileWizard";
import { businessEditSchema, type BusinessEditFormData, type BusinessEditFormInput } from "@/schemas/businessEditPayload.schema";
import type { User } from "@/types/User";
import type { SubmissionStatus } from "./types";
import { buildBusinessPayloadBase, asOptionalString, joinAddressParts } from "./helpers";
import { processStagedFiles } from "./upload";

import { useProfileWizardController } from "./hooks";

function mapBusinessToEditDefaults(business: UserBusiness): BusinessEditFormInput {
    const fullAddress = asOptionalString(business.location.address) || joinAddressParts(business.location.shopNo, business.location.street, business.location.landmark, business.location.city, business.location.state, business.location.pincode);
    const display = asOptionalString(business.location.display) || asOptionalString(business.location.formattedAddress) || joinAddressParts(business.location.city, business.location.state) || fullAddress;
    return { name: business.name || "", description: business.description || "", mobile: business.mobile || "", email: business.email || "", address: fullAddress || "", currentLocationDisplay: display || "", currentLocationSource: "", currentLocationCity: business.location.city || "", currentLocationState: business.location.state || "", currentLocationPincode: business.location.pincode || "", currentLocationCountry: business.location.country || "", coordinates: business.location.coordinates || null, images: business.images || [], idProof: business.documents?.idProof?.[0] || null, businessProof: business.documents?.businessProof?.[0] || null, certificates: business.documents?.certificates || [], idProofType: business.documents?.idProofType };
}

function getEditVariant(status: UserBusiness["status"] | undefined): "registration" | "application-edit" | "live-edit" {
    const nb = normalizeBusinessStatus(status, "pending");
    if (nb === "live") return "live-edit";
    return status === "rejected" ? "registration" : "application-edit";
}

export function BusinessEditProfileFlow({ user, initialBusiness, onRefreshUser, onComplete, onClose }: {
    user: User | null; initialBusiness?: UserBusiness | null; onRefreshUser?: () => void | Promise<void>; onComplete?: () => void; onClose?: () => void;
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(() => !initialBusiness);
    const [businessId, setBusinessId] = useState<string | null>(initialBusiness?.id ?? null);
    const [loadedBusiness, setLoadedBusiness] = useState<UserBusiness | null>(initialBusiness ?? null);
    const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
    const ie = initialBusiness ? mapBusinessToEditDefaults(initialBusiness) : { name: "", description: "", address: "", currentLocationDisplay: "", currentLocationSource: "" as const, currentLocationCity: "", currentLocationState: "", currentLocationPincode: "", currentLocationCountry: "", coordinates: null, mobile: "", email: "", idProofType: undefined, idProof: null, businessProof: null, certificates: [], images: [] };
    const form = useForm<BusinessEditFormInput, undefined, BusinessEditFormData>({ resolver: zodResolver(businessEditSchema), mode: "onBlur", reValidateMode: "onChange", defaultValues: ie });
    const wizard = useProfileWizardController<BusinessEditFormInput>(form, { requireDocuments: false });
    const { setFormError } = wizard;
    const variant = getEditVariant(loadedBusiness?.status);
    const nb = normalizeBusinessStatus(loadedBusiness?.status, "pending");
    const editTitle = variant === "live-edit" ? "Edit Business Profile" : nb === "rejected" ? "Review & Resubmit Application" : "Update Business Application";
    const submitLabel = variant === "live-edit" ? "Save Changes" : nb === "rejected" ? "Save & Resubmit" : "Update Application";

    useEffect(() => {
        const hydrate = (b: UserBusiness) => { setLoadedBusiness(b); setBusinessId(b.id); form.reset(mapBusinessToEditDefaults(b)); setIsLoading(false); };
        async function load() {
            try {
                if (initialBusiness || (loadedBusiness && businessId)) { setIsLoading(false); return; }
                const b = await getMyBusiness({ silent: true });
                if (!b) { setFormError("No business profile found."); void router.push("/account/business/apply"); return; }
                hydrate(b);
            } catch (error) { logger.error("Failed to load business details", error); setFormError(TOAST_MESSAGES.LOAD_FAILED); } finally { setIsLoading(false); }
        }
        void load();
    }, [businessId, form, initialBusiness, loadedBusiness, router, setFormError]);

    const onValidSubmit = async (data: BusinessEditFormData) => {
        if (!businessId) return;
        wizard.setFormError(null);
        setSubmissionStatus({ title: "Preparing changes", detail: "Checking updated files." });
        try {
            const images = await processStagedFiles((data.images ?? []) as Array<File | string>, { label: "Uploading shop photos", onProgress: setSubmissionStatus });
            const idProof = data.idProof ? await processStagedFiles([data.idProof as File | string], { label: "Uploading ID proof", onProgress: setSubmissionStatus }) : [];
            const businessProof = data.businessProof ? await processStagedFiles([data.businessProof as File | string], { label: "Uploading business proof", onProgress: setSubmissionStatus }) : [];
            const certificates = await processStagedFiles((data.certificates ?? []) as Array<File | string>, { label: "Uploading certificates", onProgress: setSubmissionStatus });
            const payload: Partial<CreateBusinessDTO> = { ...buildBusinessPayloadBase(data), images, documents: { idProof, idProofType: data.idProofType, businessProof, certificates } };
            setSubmissionStatus({ title: "Saving business profile", detail: "Applying updates." });
            const updated = await updateBusiness(businessId, payload);
            if (!updated) throw new Error("Update failed");
            setLoadedBusiness(updated); setSubmissionStatus(null);
            if (normalizeBusinessStatus(updated.status, "pending") === "pending") notify.success(variant === "live-edit" ? "Changes saved. Sensitive updates sent for review." : "Application updated.");
            else notify.success(TOAST_MESSAGES.UPDATE_SUCCESS);
            await onRefreshUser?.();
            window.dispatchEvent(new CustomEvent("esparex_auth_update"));
            if (onComplete) { onComplete(); return; }
            void router.push("/account/business");
        } catch (error: unknown) {
            setSubmissionStatus(null); logger.error(error);
            const injected = injectApiErrors(form, error);
            if (!injected) wizard.setFormError(mapErrorToMessage(error, TOAST_MESSAGES.LOAD_FAILED));
        }
    };

    if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" /></div>;

    return <BusinessProfileWizard wizardVariant={variant} title={editTitle} user={user} currentStep={wizard.currentStep} formData={wizard.legacyFormData} setFormData={wizard.setLegacyFormData} formError={wizard.formError} submissionStatus={submissionStatus} isSubmitting={wizard.isSubmitting} submitLabel={submitLabel} onNext={wizard.handleNext} onHeaderBack={() => { if (onClose) { onClose(); return; } void router.push("/account/business"); }} onStepChange={wizard.setCurrentStep} onSubmit={form.handleSubmit(onValidSubmit)} />;
}
