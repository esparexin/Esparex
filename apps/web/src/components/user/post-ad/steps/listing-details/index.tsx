"use client";

import { TitleSection } from "./TitleSection";
import { DescriptionSection } from "./DescriptionSection";
import { ImageUploadSection } from "./ImageUploadSection";
import { PriceSection } from "./PriceSection";
import { LocationSection } from "./LocationSection";
import { AiAvailabilityNotice } from "@/components/user/shared/AiAvailabilityNotice";
import { usePostAdFlow } from "../../context";

export function StepTwo() {
    const { isAiAvailable } = usePostAdFlow();

    return (
        <div className="space-y-6" data-testid="step-two-fields">
            {!isAiAvailable && <AiAvailabilityNotice />}
            <TitleSection />
            <DescriptionSection />
            <ImageUploadSection />
            <LocationSection />
            <PriceSection />
        </div>
    );
}
