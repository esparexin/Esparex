"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdPayloadSchema as postAdSchema, AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";

export function usePostAdForm() {
    // Initialize Form
    const form = useForm<PostAdFormData>({
        resolver: zodResolver(postAdSchema),
        mode: "all",
        shouldFocusError: true,
        defaultValues: {
            category: "",
            categoryId: "",
            sparePartId: "",
            brand: "",
            brandId: "",
            model: "",
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
 
    return useMemo(() => ({
        form,
        register,
        control,
        errors,
        watch,
        setValue,
        trigger,
        handleSubmit,
    }), [form, register, control, errors, watch, setValue, trigger, handleSubmit]);
}
