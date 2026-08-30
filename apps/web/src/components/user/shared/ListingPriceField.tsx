
import { FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@esparex/ui";
import { FieldRoot, FieldLabel, FieldControl, FieldMessage } from "@esparex/ui";
import { Stack } from "@esparex/ui";
import { cn } from "@/components/ui/utils";

export type ListingPriceFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
  label?: string;
  placeholder?: string;
  showCurrencySymbol?: boolean;
  isFree?: boolean;
  onToggleFree?: () => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function ListingPriceField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label = "Price (₹)",
  placeholder = "0",
  showCurrencySymbol = false,
  isFree = false,
  onToggleFree,
  disabled = false,
  required = true,
  className,
}: ListingPriceFieldProps<TFieldValues, TName>) {
  return (
    <FieldRoot<TFieldValues, TName>
      name={name}
      render={({ field }) => (
        <Stack gap="sm" className={className}>
          <div className="flex justify-between items-center">
            {label && (
              <FieldLabel required={required} className="text-caption sm:text-body font-semibold text-foreground-secondary">
                {label}
              </FieldLabel>
            )}
          </div>
          
          <FieldControl animateOnError>
            <div className="flex flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                {showCurrencySymbol && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-body pointer-events-none">₹</span>
                )}
                <Input
                  {...field}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  disabled={disabled || isFree}
                  placeholder={placeholder}
                  className={cn(
                    "h-11 text-body-lg md:text-body font-normal sm:font-medium rounded-xl shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all placeholder:text-caption sm:placeholder:text-body",
                    showCurrencySymbol && "pl-8",
                    isFree && "bg-muted border-transparent text-muted-foreground"
                  )}
                  // To handle controlled number input correctly
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    // allow empty string or numbers
                    if (val === "" || /^[0-9]*$/.test(val)) {
                        field.onChange(val === "" ? undefined : Number(val));
                    }
                  }}
                />
              </div>
              {onToggleFree && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!isFree}
                  onClick={onToggleFree}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      onToggleFree();
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 h-11 px-4 rounded-xl border cursor-pointer transition-all duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isFree ? "bg-primary/10 border-primary/20 text-primary" : "bg-card border-border hover:border-primary/40 text-foreground"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                    isFree ? "bg-primary border-primary" : "bg-background border-input"
                  )}>
                    {isFree && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-caption font-bold whitespace-nowrap">{isFree ? "Free" : "Make Free"}</span>
                </button>
              )}
            </div>
          </FieldControl>
          
          <FieldMessage />
        </Stack>
      )}
    />
  );
}
