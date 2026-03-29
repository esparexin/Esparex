import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/FormError";
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
            <div className="grid gap-5 md:grid-cols-2">
                <Field
                    label="Business name"
                    required
                    error={formData.errors?.businessName}
                    className="space-y-2"
                >
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">Use the public-facing business name customers will recognize.</span>
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
                    className="space-y-2"
                >
                    <div className="text-xs text-slate-500">
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

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-emerald-900">Business contact</p>
                        <p className="text-xs leading-5 text-emerald-700">
                            This is your verified account mobile number, so customers and our review team can trust it.
                        </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 shadow-sm">
                        Verified
                    </span>
                </div>
                <Input
                    id="reg-contact-number"
                    value={formData.contactNumber}
                    readOnly
                    className="mt-3 bg-white font-medium"
                    aria-invalid={Boolean(formData.errors?.contactNumber)}
                />
                <FormError message={formData.errors?.contactNumber} />
            </div>

            <Field
                label="About your business"
                required
                error={formData.errors?.businessDescription}
                className="space-y-2"
            >
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">Explain your expertise, specialties, and what customers can expect.</span>
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
