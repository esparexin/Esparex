"use client";

import { TitleSection } from "./TitleSection";
import { DescriptionSection } from "./DescriptionSection";
import { ImageUploadSection } from "./ImageUploadSection";
import { PriceSection } from "./PriceSection";
import { LocationSection } from "./LocationSection";

export function StepTwo() {
    return (
        <div className="space-y-6" data-testid="step-two-fields">
            <TitleSection />
            <DescriptionSection />
            <ImageUploadSection />
            <LocationSection />
            <PriceSection />
        </div>
    );
}
