"use client";

import { FormError, Label, Slider } from "@esparex/ui";

interface LocationRadiusSliderProps {
    value: number;
    onChange: (value: number) => void;
    error?: string;
}

export function LocationRadiusSlider({ value, onChange, error }: LocationRadiusSliderProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="alert-radius" className="text-body font-semibold text-foreground">Location Radius</Label>
                <span className="text-body font-bold text-primary">{value} km</span>
            </div>
            <Slider
                id="alert-radius"
                name="alert-radius"
                min={5}
                max={500}
                step={5}
                value={[value]}
                onValueChange={(vals) => {
                    if (vals[0] !== undefined) {
                        onChange(vals[0]);
                    }
                }}
                aria-label="Location radius in kilometers"
                className="py-3 cursor-pointer"
            />
            <div className="flex items-center justify-between text-tiny font-medium text-foreground-subtle">
                <span>5 km</span>
                <span>500 km</span>
            </div>
            <FormError message={error} />
        </div>
    );
}
