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
}: StepBasicDetailsProps) {
    return (
        <div className="space-y-4">
            <div className="grid gap-3.5 md:grid-cols-2">
                <Field
                    label="Business name"
                    required
                    error={formData.errors?.name}
                    headerExtra={
                        <span className={cn("text-xs font-medium", formData.name.length > 100 ? "text-destructive" : "text-muted-foreground")}>
                            {formData.name.length}/100
                        </span>
                    }
                    className="space-y-1"
                >
                    <Input
                        id="reg-business-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value.slice(0, 100) })}
                        placeholder="e.g. Tech Repair Solutions"
                        maxLength={100}
                        className="h-10 text-body-lg md:text-body"
                        aria-invalid={Boolean(formData.errors?.name)}
                    />
                </Field>

                <Field
                    label="Business email"
                    required
                    error={formData.errors?.email}
                    className="space-y-1"
                >
                    <Input
                        id="reg-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@yourbusiness.com"
                        className="h-10 text-body-lg md:text-body"
                        aria-invalid={Boolean(formData.errors?.email)}
                    />
                </Field>
            </div>

            <Field
                label="About your business"
                required
                error={formData.errors?.description}
                headerExtra={
                    <span className={cn("text-xs font-medium", formData.description.length > 2000 ? "text-destructive" : "text-muted-foreground")}>
                        {formData.description.length}/2000
                    </span>
                }
                className="space-y-1"
            >
                <Textarea
                    id="reg-business-desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 2000) })}
                    placeholder="Describe your business, specialties, and services..."
                    maxLength={2000}
                    rows={2}
                    className="min-h-[64px] text-body-lg md:text-body"
                    aria-invalid={Boolean(formData.errors?.description)}
                />
            </Field>
        </div>
    );
}
