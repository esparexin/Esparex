import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, FileText } from "@/icons/IconRegistry";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { StepData } from "./types";
import { ReviewSection } from "./ReviewSection";

interface StepReviewProps {
    formData: StepData;
    onBack: () => void;
    isActive: boolean;
    onEditStep: (step: number) => void;
    isSubmitting: boolean;
    submitLabel?: string;
    variant: "registration" | "application-edit" | "live-edit";
    showDocumentsSummary: boolean;
}

export function StepReview({
    formData,
    onBack,
    isActive,
    onEditStep,
    isSubmitting,
    submitLabel = "Submit Application",
    variant,
    showDocumentsSummary,
}: StepReviewProps) {
    const title = variant === "live-edit" ? "Review Changes" : "Final Review";
    const description =
        variant === "registration"
            ? "Confirm your details. Your account will be pending admin approval."
            : variant === "application-edit"
                ? "Review your updates before resubmitting your business application."
                : "Confirm your updates before saving your business profile.";
    const reviewNotice =
        variant === "registration"
            ? "Your application will be reviewed by our team within 24 working hours. Services and Parts can be managed from your Dashboard once approved."
            : variant === "application-edit"
                ? "Your updated application will remain under admin review. Replace documents only if something changed or the reviewer asked for it."
                : "Most profile changes save immediately. Sensitive changes like business name, location, or documents can send the profile back for admin review.";
    const loadingLabel = variant === "live-edit" ? "Saving..." : "Submitting...";

    if (!isActive) return null;

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#0652DD]" />
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ReviewSection
                    title="Business Details"
                    content={`${formData.businessName} (${formData.shopImages.length} photos)`}
                    onEdit={() => onEditStep(0)}
                />
                <ReviewSection
                    title="Address"
                    content={`${formData.shopNo}, ${formData.street}, ${formData.city}, ${formData.state} - ${formData.pincode}`}
                    onEdit={() => onEditStep(1)}
                />
                {showDocumentsSummary && (
                    <ReviewSection
                        title="Documents"
                        content={`${formData.idProofType ? formData.idProofType.charAt(0).toUpperCase() + formData.idProofType.slice(1).replace("_", " ") + " - " : ""}ID Proof, Business Proof`}
                        onEdit={() => onEditStep(2)}
                    />
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <FileText className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <p className="text-sm text-amber-900 leading-relaxed font-medium">
                            {reviewNotice}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none h-12 px-8 rounded-xl border-slate-200"
                    >
                        Back
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 h-12 rounded-xl bg-[#0652DD] hover:bg-[#0540b5] text-white font-bold shadow-lg shadow-blue-200 transition-all"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {loadingLabel}
                            </span>
                        ) : submitLabel}
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
