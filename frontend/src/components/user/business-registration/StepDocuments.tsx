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

interface StepDocumentsProps extends StepBaseProps { }

export function StepDocuments({
    formData,
    setFormData,
    onNext,
    onBack,
    isActive,
    isCompleted,
    onEdit
}: StepDocumentsProps) {

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
                    Verification Documents
                </CardTitle>
                <CardDescription>
                    Upload required proof for verification
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="space-y-3">
                    <Label className="text-sm font-semibold">Select ID Proof Type *</Label>
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
                </div>

                <div className={formData.idProofType ? "opacity-100" : "opacity-50 pointer-events-none transition-opacity"}>
                    <FileUploadCard
                        title="ID Proof (Owner) *"
                        description={formData.idProofType ? `Upload your ${formData.idProofType.replace("_", " ")}` : "Select ID type first"}
                        file={formData.idProof}
                        onUpload={(file) => handleFileUpload("idProof", file)}
                        onRemove={() => setFormData({ ...formData, idProof: null })}
                    />
                </div>

                <FileUploadCard
                    title="Business Proof *"
                    description="GST / Shop License / Udyam"
                    file={formData.businessProof}
                    onUpload={(file) => handleFileUpload("businessProof", file)}
                    onRemove={() => setFormData({ ...formData, businessProof: null })}
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
