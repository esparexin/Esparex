"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import { Badge } from "@/components/ui/badge";

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string;
    onChangeValue?: (value: string) => void;
    isVerified?: boolean;
    error?: boolean;
}

export function PhoneInput({
    value,
    onChangeValue,
    isVerified,
    error,
    className,
    disabled,
    ...props
}: PhoneInputProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
        onChangeValue?.(val);
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2 relative">
                <div className="h-10 px-3 bg-slate-50 border rounded-xl flex items-center text-sm text-muted-foreground border-input w-[60px] justify-center flex-shrink-0">
                    +91
                </div>
                <Input
                    {...props}
                    type="tel"
                    value={value}
                    onChange={handleChange}
                    className={cn(
                        "flex-1 h-10 rounded-xl",
                        (disabled || isVerified) && "bg-slate-50 text-muted-foreground border-slate-200 cursor-not-allowed",
                        error && "border-red-500",
                        className
                    )}
                    disabled={disabled || isVerified}
                />
                {isVerified && (
                    <Badge
                        variant="outline"
                        className="hidden md:flex absolute right-3 top-2 text-2xs text-green-600 bg-green-50 border-green-200 pointer-events-none px-2 py-0"
                    >
                        Verified
                    </Badge>
                )}
            </div>
        </div>
    );
}
