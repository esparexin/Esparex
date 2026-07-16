"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdPayloadSchema as postAdSchema, PartialAdPayloadSchema as partialAdSchema, AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { Resolver } from "react-hook-form";

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
            price: undefined as unknown as number,
            isFree: false,
            location: { city: "" } as PostAdFormData["location"],
            spareParts: [],
            deviceCondition: undefined,
        }
    });

    const { register, control, handleSubmit, watch, setValue, trigger, formState: { errors } } = form;
 
    return {
        form,
        register,
        control,
        errors,
        watch,
        setValue,
        trigger,
        handleSubmit,
    };
}
