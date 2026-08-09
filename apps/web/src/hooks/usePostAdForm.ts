"use client";

import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdPayloadSchema as postAdSchema, PartialAdPayloadSchema as partialAdSchema, AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { Resolver } from "react-hook-form";

const DRAFT_KEY = "esparex_post_ad_draft";

export function usePostAdForm(isEditMode: boolean = false) {
    // Initialize Form
    const form = useForm<PostAdFormData>({
        resolver: zodResolver(isEditMode ? partialAdSchema : postAdSchema) as Resolver<PostAdFormData>,
        mode: "all",
        shouldFocusError: true,
        defaultValues: {
            category: "",
            categoryId: "",
            brand: "",
            brandId: "",
            model: "",
            modelId: "",
            screenSize: "",

            title: "",
            description: "",
            images: [],
            price: undefined,
            isFree: false,
            location: { city: "" } as PostAdFormData["location"],
            spareParts: [],
            deviceCondition: undefined,
        }
    });

    const { register, control, handleSubmit, watch, setValue, trigger, formState: { errors } } = form;

    // Load draft on mount
    useEffect(() => {
        if (isEditMode) return;
        try {
            const draft = localStorage.getItem(DRAFT_KEY);
            if (draft) {
                const parsed = JSON.parse(draft);
                // Keep defaultValues structure but apply draft
                form.reset((prev) => ({ ...prev, ...parsed }));
            }
        } catch (e) {
            console.error("Failed to parse post ad draft", e);
        }
    }, [isEditMode, form]);

    // Save draft on change
    useEffect(() => {
        if (isEditMode) return;
        const subscription = watch((value) => {
            try {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
            } catch (e) {
                console.error("Failed to save post ad draft", e);
            }
        });
        return () => subscription.unsubscribe();
    }, [isEditMode, watch]);

    const clearDraft = useCallback(() => {
        if (isEditMode) return;
        localStorage.removeItem(DRAFT_KEY);
    }, [isEditMode]);
 
    return {
        form,
        register,
        control,
        errors,
        watch,
        setValue,
        trigger,
        handleSubmit,
        clearDraft,
    };
}
