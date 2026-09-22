
import { FieldPath, FieldValues } from "react-hook-form";
import { Input, Switch } from "@esparex/ui";
import { FieldRoot, FieldLabel, FieldControl, FieldMessage } from "@esparex/ui";
import { Stack } from "@esparex/ui";
import { cn } from "@/lib/utils";

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
              <FieldLabel required={required} className="text-body font-semibold text-foreground-secondary">
                {label}
              </FieldLabel>
            )}
          </div>
          
          <FieldControl animateOnError>
            <div className="flex flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                {showCurrencySymbol && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-normal text-body pointer-events-none">₹</span>
                )}
                <Input
                  {...field}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  disabled={disabled || isFree}
                  placeholder={placeholder}
                  className={cn(
                    "h-11 text-body-lg md:text-body font-normal rounded-xl shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all",
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
                <div className="flex items-center gap-2 h-11 px-3.5 rounded-xl border border-border bg-card shrink-0">
                  <Switch
                    id="price-is-free-switch"
                    checked={!!isFree}
                    onCheckedChange={() => onToggleFree()}
                    aria-label="Make Free"
                  />
                  <label
                    htmlFor="price-is-free-switch"
                    className="text-body font-semibold cursor-pointer select-none text-foreground whitespace-nowrap"
                  >
                    Free
                  </label>
                </div>
              )}
            </div>
          </FieldControl>
          
          <FieldMessage />
        </Stack>
      )}
    />
  );
}
