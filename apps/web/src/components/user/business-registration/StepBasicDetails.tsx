import { Field } from "@esparex/ui";
import { Input } from "@esparex/ui";
import { Textarea } from "@esparex/ui";
import type { User } from "@esparex/contracts";
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
                    labelClassName="text-caption sm:text-small font-medium text-foreground-secondary"
                    required
                    error={formData.errors?.name}
                    headerExtra={
                        <span className={cn("text-tiny font-normal tabular-nums", formData.name.length > 100 ? "text-destructive" : "text-foreground-subtle")}>
                            {formData.name.length}/100
                        </span>
                    }
                    className="space-y-1.5"
                >
                    <Input
                        id="reg-business-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value.slice(0, 100) })}
                        placeholder="e.g. Tech Repair Solutions"
                        maxLength={100}
                        className="h-11 rounded-xl text-body-lg md:text-body font-normal border-border bg-card shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                        aria-invalid={Boolean(formData.errors?.name)}
                    />
                </Field>

                <Field
                    label="Business email"
                    labelClassName="text-caption sm:text-small font-medium text-foreground-secondary"
                    required
                    error={formData.errors?.email}
                    className="space-y-1.5"
                >
                    <Input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="business@example.com"
                        className="h-11 rounded-xl text-body-lg md:text-body font-normal border-border bg-card shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                        aria-invalid={Boolean(formData.errors?.email)}
                    />
                </Field>
            </div>

            <Field
                label="About your business"
                labelClassName="text-caption sm:text-small font-medium text-foreground-secondary"
                required
                error={formData.errors?.description}
                headerExtra={
                    <span className={cn("text-tiny font-normal tabular-nums", formData.description.length > 2000 ? "text-destructive" : "text-foreground-subtle")}>
                        {formData.description.length}/2000
                    </span>
                }
                className="space-y-1.5"
            >
                <Textarea
                    id="reg-business-desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 2000) })}
                    placeholder="Describe your business, specialties, and services..."
                    maxLength={2000}
                    className="min-h-[110px] rounded-xl text-body-lg md:text-body font-normal leading-relaxed border-border bg-card shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary resize-none p-3"
                    aria-invalid={Boolean(formData.errors?.description)}
                />
            </Field>
        </div>
    );
}
