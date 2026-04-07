import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { User } from "@/types/User";
import { cn } from "@/lib/utils";
import { type StepBaseProps } from "./types";

interface StepBasicDetailsProps extends StepBaseProps {
    user: User | null;
}

export function StepBasicDetails({
    formData,
    setFormData,
    user,
}: StepBasicDetailsProps) {
    return (
        <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2">
                <Field
                    label="Business name"
                    required
                    error={formData.errors?.businessName}
                    className="space-y-1.5"
                >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs text-muted-foreground">Use the public-facing business name customers will recognize.</span>
                        <span className={cn("text-xs font-medium", formData.businessName.length > 100 ? "text-destructive" : "text-muted-foreground")}>
                            {formData.businessName.length}/100
                        </span>
                    </div>
                    <Input
                        id="reg-business-name"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value.slice(0, 100) })}
                        placeholder="e.g. Tech Repair Solutions"
                        maxLength={100}
                        aria-invalid={Boolean(formData.errors?.businessName)}
                    />
                </Field>

                <Field
                    label="Business email"
                    required
                    error={formData.errors?.email}
                    className="space-y-1.5"
                >
                    <div className="text-xs text-muted-foreground">
                        {user?.email ? "Pre-filled from your profile, but you can change it for business inquiries." : "Customers and reviewers will use this for business communication."}
                    </div>
                    <Input
                        id="reg-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@yourbusiness.com"
                        aria-invalid={Boolean(formData.errors?.email)}
                    />
                </Field>
            </div>

            <Field
                label="About your business"
                required
                error={formData.errors?.businessDescription}
                className="space-y-1.5"
            >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-muted-foreground">Explain your expertise, specialties, and what customers can expect.</span>
                    <span className={cn("text-xs font-medium", formData.businessDescription.length > 2000 ? "text-destructive" : "text-muted-foreground")}>
                        {formData.businessDescription.length}/2000
                    </span>
                </div>
                <Textarea
                    id="reg-business-desc"
                    value={formData.businessDescription}
                    onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value.slice(0, 2000) })}
                    placeholder="Describe your business, specialties, and services..."
                    maxLength={2000}
                    rows={4}
                    aria-invalid={Boolean(formData.errors?.businessDescription)}
                />
            </Field>
        </div>
    );
}
