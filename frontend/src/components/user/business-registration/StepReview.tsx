import { CheckCircle2, FileText } from "@/icons/IconRegistry";
import { ReviewSection } from "./ReviewSection";
import { type StepData } from "./types";

interface StepReviewProps {
    formData: StepData;
    onEditStep: (step: number) => void;
    variant: "registration" | "application-edit" | "live-edit";
    showDocumentsSummary: boolean;
    detailsStepIndex?: number;
    documentsStepIndex?: number;
}

export function StepReview({
    formData,
    onEditStep,
    variant,
    showDocumentsSummary,
    detailsStepIndex = 0,
    documentsStepIndex = 2,
}: StepReviewProps) {
    const idProofTypeLabel = {
        aadhaar: "Aadhaar card",
        pan: "PAN card",
        driving_license: "Driving license",
        voter_id: "Voter ID",
    }[formData.idProofType || ""] ?? "Owner ID proof type not selected";

    const reviewNotice =
        variant === "registration"
            ? "After submission, the review team checks your business details and documents before the profile goes live."
            : variant === "application-edit"
                ? "Your updated application stays under review until the new details are approved."
                : "Most edits save immediately, but business name, address, and document changes can trigger a fresh admin review.";

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-emerald-900">Final check before you continue</p>
                        <p className="text-sm leading-6 text-emerald-800">{reviewNotice}</p>
                    </div>
                </div>
            </div>

            <ReviewSection
                title="Business details"
                onEdit={() => onEditStep(detailsStepIndex)}
                content={
                    <>
                        <p className="text-sm font-semibold text-slate-900">{formData.businessName}</p>
                        <p className="text-sm leading-6 text-slate-600">{formData.businessDescription}</p>
                        <p className="text-sm text-slate-500">{formData.email}</p>
                    </>
                }
            />

            <ReviewSection
                title="Address"
                onEdit={() => onEditStep(detailsStepIndex)}
                content={
                    <>
                        <p className="text-sm font-semibold text-slate-900">
                            {formData.currentLocationDisplay || "Current location pending"}
                        </p>
                        <p className="text-sm leading-6 text-slate-600">{formData.fullAddress}</p>
                        <p className="text-sm text-slate-500">
                            Current location is recorded first, then the full address is sent for admin review.
                        </p>
                    </>
                }
            />

            {showDocumentsSummary && (
                <ReviewSection
                    title="Verification"
                    onEdit={() => onEditStep(documentsStepIndex)}
                    content={
                        <>
                            <p className="text-sm font-semibold text-slate-900">
                                {formData.shopImages.length} shop photo{formData.shopImages.length === 1 ? "" : "s"} ready for review
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {formData.idProofType ? `${idProofTypeLabel} selected as owner ID` : idProofTypeLabel}
                            </p>
                            <p className="text-sm text-slate-600">
                                {formData.idProof ? "Owner ID proof attached" : "Owner ID proof missing"}
                            </p>
                            <p className="text-sm text-slate-600">
                                {formData.businessProof ? "Business proof attached" : "Business proof missing"}
                            </p>
                            <p className="text-sm text-slate-500">
                                {formData.certificates.length} optional certificate{formData.certificates.length === 1 ? "" : "s"} attached
                            </p>
                        </>
                    }
                />
            )}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                        <FileText className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-amber-900">What happens after this</p>
                        <p className="text-sm leading-6 text-amber-800">
                            Make sure the business name, address, and proofs match the real business exactly. Mismatched details slow down approval.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
