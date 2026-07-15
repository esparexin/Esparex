"use client";

import { usePostAdAction } from "../../context";
import { CategorySection } from "./CategorySection";
import { BrandSection } from "./BrandSection";
import { ModelSection } from "./ModelSection";
import { SpecificationSection } from "./SpecificationSection";
import { ScreenSizeSection } from "./ScreenSizeSection";
import { DeviceConditionSection } from "./DeviceConditionSection";
import { SparePartsSection } from "./SparePartsSection";
import { useLayoutEffect } from "react";

export function StepOne() {
    const { register, watch } = usePostAdAction();
    const categoryId = String(watch("categoryId") || watch("category") || "");

    useLayoutEffect(() => { 
        register("category"); 
        register("brand"); 
        register("brandId"); 
        register("model"); 
        register("modelId"); 
        register("attributes"); 
        register("screenSize"); 
        register("deviceCondition"); 
    }, [register]);

    return (
        <div className="space-y-6" data-testid="step-one-fields">
            <CategorySection />
            
            {categoryId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BrandSection />
                    <ModelSection />
                </div>
            )}
            
            {categoryId && (
                <div className="flex flex-col gap-6">
                    <SpecificationSection />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <ScreenSizeSection />
                        <DeviceConditionSection />
                    </div>
                    
                    <SparePartsSection />
                </div>
            )}
        </div>
    );
}
