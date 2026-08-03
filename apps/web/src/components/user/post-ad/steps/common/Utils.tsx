import { useCallback } from "react";
import { useWatch } from "react-hook-form";
import { cn } from "@/components/ui/utils";
import { usePostAdFlow } from "../../context";
import { getFirstFormErrorMessage } from "@/components/user/shared/ListingFormFields";

export const getNestedFieldMeta = (source: unknown, path: string): unknown =>
    path.split(".").reduce<unknown>((current, segment) => {
        if (!current || typeof current !== "object") return undefined;
        return (current as Record<string, unknown>)[segment];
    }, source);

export function useStepFieldError(stepNumber: number) {
    const { form, stepValidationAttempts } = usePostAdFlow();
    const { touchedFields, errors, submitCount } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[stepNumber]);
    const hasAttemptedSubmit = submitCount > 0;

    return useCallback((path: string): string | undefined => {
        const shouldShow = hasAttemptedSubmit || hasAttemptedStepValidation || Boolean(getNestedFieldMeta(touchedFields, path));
        if (!shouldShow) return undefined;

        const meta = getNestedFieldMeta(errors, path);
        if (typeof meta === "string") return meta;
        if (meta && typeof meta === "object" && "message" in meta && typeof (meta as any).message === "string") {
            return (meta as any).message;
        }
        return getFirstFormErrorMessage(meta);
    }, [hasAttemptedStepValidation, hasAttemptedSubmit, touchedFields, errors]);
}

export function CharCounter({ name, max }: { name: string; max: number }) {
    const value = useWatch({ name }) as string || "";
    return (
        <span className={cn(
            "text-xs font-normal tracking-tight",
            value.length >= max ? "text-amber-600" : "text-foreground-subtle"
        )}>
            {value.length} / {max}
        </span>
    );
}

export { getFirstFormErrorMessage } from "@/components/user/shared/ListingFormFields";
