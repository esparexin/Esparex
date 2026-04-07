import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { StepBaseProps } from "./types";
import { FileUploadCard } from "./FileUploadCard";
import {
    BUSINESS_DOCUMENT_ACCEPT,
    BUSINESS_UPLOAD_MAX_MB,
} from "@/schemas/business.schema.shared";

interface StepDocumentsProps extends StepBaseProps {
    variant: "registration" | "application-edit";
}

export function StepDocuments({
    formData,
    setFormData,
    variant,
}: StepDocumentsProps) {
    const isRegistration = variant === "registration";
    const canUploadIdProof = isRegistration ? Boolean(formData.idProofType) : true;
    const documentHelperText = `PDF, JPG, PNG, WebP, AVIF, HEIC, HEIF up to ${BUSINESS_UPLOAD_MAX_MB}MB`;
    const selectedIdProofLabel = {
        aadhaar: "Aadhaar card",
        pan: "PAN card",
        driving_license: "Driving license",
        voter_id: "Voter ID",
    }[formData.idProofType || ""] ?? "owner ID document";

    const handleFileUpload = (field: "idProof" | "businessProof", file: File) => {
        setFormData({ ...formData, [field]: file });
    };

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {isRegistration
                    ? "Upload the owner ID and one business proof document the review team needs for approval."
                    : "Replace these files only if details changed or the review team asked for fresh documents."}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <Field
                    label={`ID proof type${isRegistration ? "" : " (optional)"}`}
                    required={isRegistration}
                    error={formData.errors?.idProofType}
                    className="space-y-1.5"
                >
                    <p className="text-xs text-muted-foreground">Pick the owner ID you are uploading so admins can review it correctly.</p>
                    <Select
                        value={formData.idProofType || ""}
                        onValueChange={(value) => setFormData({ ...formData, idProofType: value })}
                    >
                        <SelectTrigger
                            className="w-full bg-white"
                            aria-invalid={Boolean(formData.errors?.idProofType)}
                        >
                            <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="aadhaar">Aadhaar card</SelectItem>
                            <SelectItem value="pan">PAN card</SelectItem>
                            <SelectItem value="driving_license">Driving license</SelectItem>
                            <SelectItem value="voter_id">Voter ID</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
                    <Label className="text-sm font-semibold text-blue-900">Before you upload</Label>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-blue-800">
                        <li>Use clear, uncropped photos or PDFs so the reviewer can read every detail.</li>
                        <li>Files stay local until you submit this form.</li>
                        <li>Existing documents stay active until new ones are saved.</li>
                    </ul>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className={canUploadIdProof ? "opacity-100" : "pointer-events-none opacity-60"}>
                    <FileUploadCard
                        title={`Owner ID proof${isRegistration ? " *" : ""}`}
                        description={
                            canUploadIdProof
                                ? formData.idProofType
                                    ? `Upload your ${selectedIdProofLabel}`
                                    : "Replace the existing owner ID document if needed"
                                : "Select the ID proof type first"
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
                    title={`Business proof${isRegistration ? " *" : ""}`}
                    description={
                        isRegistration
                            ? "Upload GST, shop license, Udyam, or another business proof document"
                            : "Replace GST, shop license, Udyam, or another proof document if it changed"
                    }
                    file={formData.businessProof}
                    onUpload={(file) => handleFileUpload("businessProof", file)}
                    onRemove={() => setFormData({ ...formData, businessProof: null })}
                    accept={BUSINESS_DOCUMENT_ACCEPT}
                    helperText={documentHelperText}
                    error={formData.errors?.businessProof}
                />
            </div>
        </div>
    );
}
