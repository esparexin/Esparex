"use client";

import { TitleSection } from "./TitleSection";
import { DescriptionSection } from "./DescriptionSection";
import { ImageUploadSection } from "./ImageUploadSection";
import { PriceSection } from "./PriceSection";
import { LocationSection } from "./LocationSection";

export function StepTwo() {
    return (
        <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0" data-testid="step-two-fields">
            <div className="space-y-6">
                <TitleSection />
                <DescriptionSection />
            </div>
            <div className="space-y-6">
                <ImageUploadSection />
                <LocationSection />
                <PriceSection />
            </div>
        </div>
    );
}
