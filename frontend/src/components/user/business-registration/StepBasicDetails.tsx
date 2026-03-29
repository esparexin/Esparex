import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, ChevronRight, X, Upload } from "@/icons/IconRegistry";
import { StepBaseProps } from "./types";
import { CompletedStepCard } from "./CompletedStepCard";
import { User } from "@/types/User";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { cn } from "@/lib/utils";
import { BUSINESS_IMAGE_ACCEPT, BUSINESS_UPLOAD_MAX_MB } from "@/schemas/business.schema.shared";

interface StepBasicDetailsProps extends StepBaseProps {
    user: User | null;
}

export function StepBasicDetails({
    formData,
    setFormData,
    onNext,
    onBack: _onBack,
    isActive,
    isCompleted,
    onEdit,
    user
}: StepBasicDetailsProps) {
    const removeShopImage = (index: number) => {
        const newImages = [...formData.shopImages];
        newImages.splice(index, 1);
        setFormData({ ...formData, shopImages: newImages });
    };

    const handleShopImageUpload = (files: FileList) => {
        if (formData.shopImages.length + files.length > 5) {
            // Don't set local error - let Zod handle it
            return;
        }
        const newFiles = Array.from(files);
        setFormData({
            ...formData,
            shopImages: [...formData.shopImages, ...newFiles]
        });
    };

    if (isCompleted && !isActive) {
        return (
            <CompletedStepCard
                title="Business Details"
                summary={`${formData.businessName} (${formData.shopImages.length} images)`}
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
                    Business Details & Images
                </CardTitle>
                <CardDescription>
                    Provide information about your business and workspace
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Business Name */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="reg-business-name">Business Name *</Label>
                        <span className={cn("text-xs font-medium", 
                            formData.businessName.length > 100 ? "text-destructive" : "text-muted-foreground"
                        )}>
                            {formData.businessName.length} / 100
                        </span>
                    </div>
                    <Input
                        id="reg-business-name"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value.slice(0, 100) })}
                        placeholder="e.g., Tech Repair Solutions"
                        maxLength={100}
                        className={formData.errors?.businessName ? "border-red-500" : ""}
                    />
                    {formData.errors?.businessName && (
                        <p className="text-xs text-red-500 mt-1">{formData.errors.businessName}</p>
                    )}
                </div>

                {/* Contact Number - Locked to verified mobile */}
                <div className="space-y-2">
                    <Label htmlFor="reg-contact-number">
                        Business Contact *
                        <span className="text-xs text-green-600 ml-2 font-medium">✓ Verified Mobile</span>
                    </Label>
                    <PhoneInput
                        id="reg-contact-number"
                        value={formData.contactNumber}
                        placeholder="9876543210"
                        error={!!formData.errors?.contactNumber}
                        isVerified={true} // Always locked - only verified users can register
                        disabled
                    />
                    <p className="text-xs text-slate-500">This is your registered mobile number and cannot be changed.</p>
                </div>

                {/* Business Email */}
                <div className="space-y-2">
                    <Label htmlFor="reg-email">
                        Business Email *
                        {user?.email && <span className="text-xs text-slate-500 ml-2 font-normal">(Pre-filled from profile)</span>}
                    </Label>
                    <Input
                        id="reg-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@yourbusiness.com"
                        className={formData.errors?.email ? "border-red-500" : ""}
                    />
                    {formData.errors?.email && (
                        <p className="text-xs text-red-500 mt-1">{formData.errors.email}</p>
                    )}
                    <p className="text-xs text-slate-500">You can use a different email for business inquiries.</p>
                </div>

                {/* Business Description */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="reg-business-desc">About Your Business *</Label>
                        <span className={cn("text-xs font-medium", 
                            formData.businessDescription.length > 500 ? "text-destructive" : "text-muted-foreground"
                        )}>
                            {formData.businessDescription.length} / 500
                        </span>
                    </div>
                    <Textarea
                        id="reg-business-desc"
                        value={formData.businessDescription}
                        onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value.slice(0, 500) })}
                        placeholder="Describe your business, specialties, and services..."
                        maxLength={500}
                        rows={3}
                        className={formData.errors?.businessDescription ? "border-red-500" : ""}
                    />
                    {formData.errors?.businessDescription && (
                        <p className="text-xs text-red-500 mt-1">{formData.errors.businessDescription}</p>
                    )}
                </div>

                {/* Shop Images */}
                <div className="space-y-3 pt-2">
                    <div>
                        <Label>Shop / Workshop Images *</Label>
                        <p className="text-xs text-muted-foreground mb-1">
                            Upload 1-5 images. Supported: JPG, PNG, WebP, AVIF, HEIC, HEIF up to {BUSINESS_UPLOAD_MAX_MB}MB each.
                        </p>
                        {formData.errors?.shopImages && (
                            <p className="text-xs text-red-500 mt-1">{formData.errors.shopImages}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.shopImages.map((file, index) => (
                            <div key={index} className="relative aspect-square border-2 border-dashed rounded-xl overflow-hidden group">
                                <Image
                                    src={file instanceof File ? URL.createObjectURL(file) : file}
                                    alt={`Shop ${index + 1}`}
                                    fill
                                    unoptimized
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="destructive"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeShopImage(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {formData.shopImages.length < 5 && (
                            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#0652DD] hover:bg-blue-50 transition-colors">
                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">Upload</span>
                                <span className="text-xs text-gray-400 mt-1">
                                    {formData.shopImages.length}/5
                                </span>
                                <input
                                    id="reg-shop-images"
                                    name="reg-shop-images"
                                    type="file"
                                    accept={BUSINESS_IMAGE_ACCEPT}
                                    multiple
                                    className="hidden"
                                    onChange={(e) => e.target.files && handleShopImageUpload(e.target.files)}
                                />
                            </label>
                        )}
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-end gap-4 md:static md:bg-transparent md:border-0 md:p-0 md:mt-8">
                    <Button
                        type="button"
                        onClick={onNext}
                        className="w-full md:w-auto h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100"
                    >
                        Continue
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
