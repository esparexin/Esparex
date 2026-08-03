import { useWatch } from "react-hook-form";
import { cn } from "@/components/ui/utils";

export const getNestedFieldMeta = (source: unknown, path: string): unknown =>
    path.split(".").reduce<unknown>((current, segment) => {
        if (!current || typeof current !== "object") return undefined;
        return (current as Record<string, unknown>)[segment];
    }, source);

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

