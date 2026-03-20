"use client";

import React, { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import type { ListingImage } from "@/types/listing";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/hooks/useBusiness";
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import { createAd } from "@/api/user/ads";
import { Loader2, Upload, X } from "@/icons/IconRegistry";

// Schema matching the unified Ad model with service attributes
const PostServiceSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(60),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().min(1, "Brand is required"),
  attributes: z.object({
    serviceTypeIds: z.array(z.string()).min(1, "At least one service type is required"),
  }),
  price: z.coerce.number().min(0, "Price must be positive"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  location: z.object({
    city: z.string(),
    state: z.string(),
    display: z.string(),
    coordinates: z.object({
      type: z.literal("Point"),
      coordinates: z.tuple([z.number(), z.number()])
    }),
    locationId: z.string().optional()
  }).optional(),
});

type PostServiceValues = z.infer<typeof PostServiceSchema>;

const MOCK_CATEGORIES = [
  { id: "cat1", name: "Mobile Repair" },
  { id: "cat2", name: "Laptop Repair" },
  { id: "cat3", name: "Appliance Repair" }
];

const MOCK_BRANDS = [
  { id: "br1", name: "Apple" },
  { id: "br2", name: "Samsung" },
  { id: "br3", name: "LG" }
];

const MOCK_SERVICE_TYPES = [
  { id: "st1", name: "Screen Replacement" },
  { id: "st2", name: "Battery Replacement" },
  { id: "st3", name: "Water Damage Repair" },
  { id: "st4", name: "Diagnostic" }
];

export function PostServiceForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { businessData, isLoading: isLoadingBusiness } = useBusiness(user);

  const form = useForm<PostServiceValues>({
    resolver: zodResolver(PostServiceSchema),
    defaultValues: {
      title: "",
      categoryId: "",
      brandId: "",
      attributes: { serviceTypeIds: [] },
      price: 0,
      description: "",
      location: undefined
    }
  });

  // Pre-fill location once business data loads
  useEffect(() => {
    if (businessData?.location) {
      form.setValue("location", {
        city: businessData.location.city || "",
        state: businessData.location.state || "",
        display: businessData.location.display || "",
        coordinates: businessData.location.coordinates || { type: "Point", coordinates: [0, 0] },
        locationId: businessData.location.locationId
      });
    }
  }, [businessData, form]);

  const [images, setImages] = React.useState<ListingImage[]>([]);
  const [isUploadingImages] = React.useState(false);

  const handleImageUpload = (files: File[]) => {
    const newImages = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      preview: URL.createObjectURL(file),
      file,
      isRemote: false
    }));
    setImages(prev => [...prev, ...newImages].slice(0, 10));
  };

  const removeImage = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const { onValidSubmit, isSubmitting } = useListingSubmission({
    form,
    listingImages: images,
    isEditMode: false,
    schema: PostServiceSchema,
    submitFn: async (payload: NonNullable<unknown>) => {
      const typedPayload = payload as Partial<PostServiceValues>;
      const finalPayload = {
        ...typedPayload,
        listingType: "service" as const,
      };
      return createAd(finalPayload);
    },
    onSuccess: () => {
      router.push("/post-service-success");
    },
    folder: "services"
  });

  if (isLoadingBusiness) {
    return <div className="p-8 text-center text-slate-500 font-inter">Loading business profile...</div>;
  }

  return (
    <div className="max-w-xl mx-auto bg-white sm:rounded-2xl sm:shadow-lg sm:border border-slate-200 overflow-hidden flex flex-col h-[100dvh] sm:h-auto font-inter">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-4 shrink-0 sm:pt-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">Post a Service</h1>
        <p className="text-sm text-slate-600 mt-1">Offer your repair and maintenance services</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 overscroll-contain">
        <FormProvider {...form}>
          <form id="post-service-form" onSubmit={form.handleSubmit(onValidSubmit)} className="space-y-6">
            
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 block">Service Title</label>
              <Input placeholder="e.g. Broken Screen Replacement" className="h-12 bg-slate-50 border-slate-200 rounded-xl" {...form.register("title")} />
              {form.formState.errors.title && <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 block">Category</label>
                <select 
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3" 
                  {...form.register("categoryId")}
                >
                  <option value="">Select Category</option>
                  {MOCK_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {form.formState.errors.categoryId && <p className="text-red-500 text-sm">{form.formState.errors.categoryId.message}</p>}
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 block">Brand</label>
                <select 
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3" 
                  {...form.register("brandId")}
                >
                  <option value="">Select Brand</option>
                  {MOCK_BRANDS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {form.formState.errors.brandId && <p className="text-red-500 text-sm">{form.formState.errors.brandId.message}</p>}
              </div>
            </div>

            {/* Service Types */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-slate-900 block">Service Types</label>
                <p className="text-xs text-slate-500">Select all that apply</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_SERVICE_TYPES.map((type) => (
                  <label key={type.id} className="flex flex-row items-center space-x-3 rounded-xl border border-slate-200 p-3 bg-slate-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      value={type.id} 
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      {...form.register("attributes.serviceTypeIds")}
                    />
                    <span className="font-medium text-slate-700 text-sm">{type.name}</span>
                  </label>
                ))}
              </div>
              {form.formState.errors.attributes?.serviceTypeIds && <p className="text-red-500 text-sm">{form.formState.errors.attributes.serviceTypeIds.message}</p>}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 block">Price (Starting from)</label>
              <Input type="number" placeholder="0" className="h-12 bg-slate-50 border-slate-200 rounded-xl" {...form.register("price", { valueAsNumber: true })} />
              {form.formState.errors.price && <p className="text-red-500 text-sm">{form.formState.errors.price.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900 block">Description</label>
              <Textarea 
                placeholder="Describe your service in detail..." 
                className="min-h-[120px] bg-slate-50 border-slate-200 rounded-xl resize-none" 
                {...form.register("description")} 
              />
              {form.formState.errors.description && <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>}
            </div>

            {/* Images */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-900 block">Service Images</label>
              <div className="grid grid-cols-3 gap-3">
                  {images.map((img) => (
                      <div key={img.id} className="aspect-square relative group rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-sm">
                          <img src={img.preview} alt="Listing" className="w-full h-full object-cover" />
                          <button
                              type="button"
                              onClick={(e) => removeImage(img.id, e)}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-100 disabled:opacity-50"
                              disabled={isSubmitting || isUploadingImages}
                          >
                              <X className="w-3 h-3" />
                          </button>
                      </div>
                  ))}
                  
                  {images.length < 10 && (
                      <label className={cn(
                          "aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all bg-slate-50/50",
                          (isUploadingImages || isSubmitting) ? "opacity-50 cursor-not-allowed border-slate-200" : "border-slate-200 hover:border-blue-500 hover:bg-blue-50"
                      )}>
                          <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(Array.from(e.target.files || []))}
                              disabled={isUploadingImages || isSubmitting}
                          />
                          {isUploadingImages ? (
                              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                          ) : (
                              <>
                                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 border border-slate-100">
                                      <Upload className="w-5 h-5 text-blue-500" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add Photo</span>
                                  <span className="text-[9px] text-slate-300 mt-0.5">{images.length}/10</span>
                              </>
                          )}
                      </label>
                  )}
              </div>
              {images.length === 0 && (
                <p className="text-sm font-medium text-red-500">At least one image is required</p>
              )}
            </div>

            {/* Location (Read-Only) */}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-semibold text-slate-900 flex items-center gap-2 block">
                Location
                <span className="bg-slate-200 text-slate-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded ml-auto">Auto-filled</span>
              </label>
              <Input 
                disabled 
                value={form.watch("location.display") || "Loading from business profile..."} 
                className="h-12 bg-slate-100 text-slate-500 border-slate-200 rounded-xl disabled:opacity-100" 
              />
              <p className="text-xs text-slate-500">Service location is based on your registered business address.</p>
            </div>

          </form>
        </FormProvider>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="shrink-0 bg-white border-t border-slate-200 p-4 sm:p-6 pb-safe">
        <Button 
          type="submit" 
          form="post-service-form" 
          disabled={isSubmitting || isUploadingImages || images.length === 0}
          className="w-full h-14 text-base font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          {isSubmitting ? "Submitting Service..." : "Submit Service"}
        </Button>
      </div>
    </div>
  );
}
