import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronRight } from "@/icons/IconRegistry";
import { StepBaseProps } from "./types";
import { CompletedStepCard } from "./CompletedStepCard";
import { FileUploadCard } from "./FileUploadCard";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BUSINESS_DOCUMENT_ACCEPT, BUSINESS_UPLOAD_MAX_MB } from "@/schemas/business.schema.shared";

interface StepDocumentsProps extends StepBaseProps {
    variant: "registration" | "application-edit";
}

export function StepDocuments({
    formData,
    setFormData,
    onNext,
    onBack,
    isActive,
    isCompleted,
    onEdit,
    variant,
}: StepDocumentsProps) {
    const isRegistration = variant === "registration";
    const canUploadIdProof = isRegistration ? Boolean(formData.idProofType) : true;
    const documentHelperText = `PDF, JPG, PNG, WebP, AVIF, HEIC, HEIF (Max ${BUSINESS_UPLOAD_MAX_MB}MB)`;

    const handleFileUpload = (field: "idProof" | "businessProof", file: File) => {
        setFormData({ ...formData, [field]: file });
    };

    if (isCompleted && !isActive) {
        return (
            <CompletedStepCard
                title="Documents"
                summary="ID Proof & Business Proof uploaded"
                onEdit={onEdit}
            />
        );
    }

    if (!isActive) return null;

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#0652DD]" />
                    {isRegistration ? "Verification Documents" : "Application Documents"}
                </CardTitle>
                <CardDescription>
                    {isRegistration
                        ? "Upload required proof for verification"
                        : "Update documents only if they changed or our review team asked for replacements."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!isRegistration && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        Existing documents stay attached unless you replace them here.
                    </div>
                )}

                <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                        Select ID Proof Type {isRegistration ? "*" : "(Optional)"}
                    </Label>
                    <Select
                        value={formData.idProofType || ""}
                        onValueChange={(val) => setFormData({ ...formData, idProofType: val })}
                    >
                        <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="Select Document Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                            <SelectItem value="pan">PAN Card</SelectItem>
                            <SelectItem value="driving_license">Driving License</SelectItem>
                            <SelectItem value="voter_id">Voter ID</SelectItem>
                        </SelectContent>
                    </Select>
                    {formData.errors?.idProofType && (
                        <p className="text-xs text-red-500">{formData.errors.idProofType}</p>
                    )}
                </div>

                <div className={canUploadIdProof ? "opacity-100" : "opacity-50 pointer-events-none transition-opacity"}>
                    <FileUploadCard
                        title={`ID Proof (Owner) ${isRegistration ? "*" : ""}`.trim()}
                        description={
                            canUploadIdProof
                                ? formData.idProofType
                                    ? `Upload your ${formData.idProofType.replace("_", " ")}`
                                    : "Replace your current owner ID proof if needed"
                                : "Select ID type first"
                        }
                        file={formData.idProof}
                        onUpload={(file) => handleFileUpload("idProof", file)}
                        onRemove={() => setFormData({ ...formData, idProof: null })}
                        accept={BUSINESS_DOCUMENT_ACCEPT}
                        helperText={documentHelperText}
                        error={formData.errors?.idProof}
                    />
                </div>

                <FileUploadCard
                    title={`Business Proof ${isRegistration ? "*" : ""}`.trim()}
                    description={isRegistration ? "GST / Shop License / Udyam" : "GST, shop license, Udyam, or any updated business proof"}
                    file={formData.businessProof}
                    onUpload={(file) => handleFileUpload("businessProof", file)}
                    onRemove={() => setFormData({ ...formData, businessProof: null })}
                    accept={BUSINESS_DOCUMENT_ACCEPT}
                    helperText={documentHelperText}
                    error={formData.errors?.businessProof}
                />

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-between gap-4 md:static md:bg-transparent md:border-0 md:p-0 md:mt-8">
                    <Button type="button" variant="outline" onClick={onBack} className="flex-1 md:flex-none h-12 px-8 rounded-xl border-slate-200">
                        Back
                    </Button>
                    <Button
                        type="button"
                        onClick={onNext}
                        className="flex-1 md:flex-none h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100"
                    >
                        Continue to Review
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
