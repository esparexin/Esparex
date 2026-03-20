import Image from "next/image";
import { useSparePartListing } from "../SparePartListingContext";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, MapPin } from "@/icons/IconRegistry";

export default function Step2ListingInfo({ isActive }: { isActive: boolean }) {
    const {
        form: { register, formState: { errors } },
        addImages,
        removeImage,
        listingImages,
        businessLocationDisplay,
    } = useSparePartListing();

    if (!isActive) return null;

    return (
        <div className="flex flex-col gap-8 pb-12">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Listing Info</h2>
                <p className="text-muted-foreground">
                    Add photos, set a price, and provide a description.
                </p>
            </div>

            {/* Title & Description */}
            <div className="space-y-4">
                <Field label="Part Title" error={errors.title?.message} required>
                    <Input
                        {...register("title")}
                        placeholder="e.g. iPhone 14 OLED Display Screen"
                    />
                </Field>

                <Field label="Description" error={errors.description?.message} required>
                    <Textarea
                        {...register("description")}
                        placeholder="Describe the part condition, origin, and compatibility details..."
                        className="min-h-[120px]"
                    />
                </Field>
            </div>

            {/* Price */}
            <Field label="Price (₹)" error={errors.price?.message} required>
                <Input
                    type="number"
                    {...register("price", { valueAsNumber: true })}
                    placeholder="0"
                    min={0}
                />
            </Field>

            {/* Images */}
            <Field label="Photos" error={errors.images?.message} required>
                <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                        <Upload className="w-8 h-8 text-muted-foreground mb-1" />
                        <span className="text-sm text-muted-foreground">Tap to add photos</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={e => {
                                if (e.target.files) {
                                    addImages(Array.from(e.target.files));
                                    e.target.value = "";
                                }
                            }}
                        />
                    </label>
                    {listingImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {listingImages.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
                                    <Image
                                        src={img.preview}
                                        alt="Preview"
                                        fill
                                        unoptimized
                                        sizes="(max-width: 640px) 33vw, 25vw"
                                        className="object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Field>

            {/* Business Location (read-only pre-fill) */}
            <Field label="Listing Location">
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-slate-700">
                        {businessLocationDisplay || "Business location not available"}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">(from your business)</span>
                </div>
            </Field>
        </div>
    );
}
