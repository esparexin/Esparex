"use client";

import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/FormError";

interface LocationRadiusSliderProps {
    value: number;
    onChange: (value: number) => void;
    error?: string;
}

export function LocationRadiusSlider({ value, onChange, error }: LocationRadiusSliderProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="alert-radius" className="text-caption font-semibold text-foreground">Location Radius</Label>
                <span className="text-caption font-bold text-primary">{value} km</span>
            </div>
            <input
                id="alert-radius"
                name="alert-radius"
                type="range"
                min="5"
                max="500"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value, 10) || 5)}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary my-1"
            />
            <div className="flex items-center justify-between text-tiny font-medium text-foreground-subtle">
                <span>5 km</span>
                <span>500 km</span>
            </div>
            <FormError message={error} />
        </div>
    );
}
