import { useRef, useState } from "react";
import { useSparePartListing } from "../SparePartListingContext";
import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Check, CircuitBoard } from "@/icons/IconRegistry";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

export default function Step1PartDetails({ isActive }: { isActive: boolean }) {
    const {
        categories,
        brands,
        models,
        spareParts,
        selectedCompatibleModels,
        handleCategoryChange,
        handleBrandChange,
        toggleCompatibleModel,
        form: { watch, setValue, formState: { errors } },
    } = useSparePartListing();

    const categoryId = watch("category");
    const brandName = watch("brand");
    const sparePartId = watch("sparePartId");

    const [brandSearch, setBrandSearch] = useState("");
    const [partSearch, setPartSearch] = useState("");
    const brandInputRef = useRef<HTMLInputElement>(null);

    if (!isActive) return null;

    const selectedSparePart = spareParts.find(p => (p.id || p._id) === sparePartId);

    return (
        <div className="flex flex-col gap-8 pb-12">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Part Details</h2>
                <p className="text-muted-foreground">
                    Select the category, the spare part you are selling, and optionally specify compatible device models.
                </p>
            </div>

            {/* Category */}
            <section className="space-y-3">
                <Field label="Category" error={errors.category?.message} required>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {categories.map(cat => {
                            const catId = cat.id;
                            if (!catId) return null;
                            return (
                                <Button
                                    key={catId}
                                    type="button"
                                    variant={catId === categoryId ? "default" : "outline"}
                                    onClick={() => handleCategoryChange(catId)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 h-auto py-4 rounded-xl transition-all",
                                        catId === categoryId ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
                                    )}
                                >
                                    <CircuitBoard className="w-6 h-6" />
                                    <span className="text-xs font-medium">{cat.name}</span>
                                </Button>
                            );
                        })}
                    </div>
                </Field>
            </section>

            {/* Spare Part */}
            {categoryId && (
                <section className="space-y-3">
                    <Field label="Spare Part" error={errors.sparePartId?.message} required>
                        {selectedSparePart ? (
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                <span className="font-medium">{selectedSparePart.name}</span>
                                <button
                                    type="button"
                                    onClick={() => { setValue("sparePartId", ""); setValue("sparePartName", ""); }}
                                    className="text-muted-foreground hover:text-destructive text-sm"
                                >
                                    Change
                                </button>
                            </div>
                        ) : (
                            <Command className="border rounded-lg">
                                <CommandInput
                                    placeholder="Search spare parts..."
                                    value={partSearch}
                                    onValueChange={setPartSearch}
                                />
                                <CommandList className="max-h-40">
                                    {spareParts.length === 0 && (
                                        <CommandEmpty>No spare parts found for this category.</CommandEmpty>
                                    )}
                                    <CommandGroup>
                                        {spareParts
                                            .filter(p => p.name.toLowerCase().includes(partSearch.toLowerCase()))
                                            .map(part => {
                                                const id = part.id || part._id || "";
                                                return (
                                                    <CommandItem
                                                        key={id}
                                                        onSelect={() => {
                                                            setValue("sparePartId", id, { shouldValidate: true });
                                                            setValue("sparePartName", part.name);
                                                            setPartSearch("");
                                                        }}
                                                    >
                                                        {part.name}
                                                    </CommandItem>
                                                );
                                            })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        )}
                    </Field>
                </section>
            )}

            {/* Brand (for filtering compatible models) */}
            {categoryId && spareParts.length > 0 && (
                <section className="space-y-3">
                    <Field label="Compatible with Brand (optional)">
                        <Command className="border rounded-lg">
                            <CommandInput
                                ref={brandInputRef}
                                placeholder="Search brand..."
                                value={brandSearch}
                                onValueChange={setBrandSearch}
                            />
                            <CommandList className="max-h-36">
                                <CommandGroup>
                                    {brands
                                        .filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))
                                        .map(b => (
                                            <CommandItem
                                                key={b}
                                                onSelect={() => {
                                                    handleBrandChange(b);
                                                    setBrandSearch(b);
                                                }}
                                            >
                                                {b === brandName && <Check className="mr-2 w-4 h-4" />}
                                                {b}
                                            </CommandItem>
                                        ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </Field>
                </section>
            )}

            {/* Compatible Models */}
            {models.length > 0 && (
                <section className="space-y-3">
                    <Field label="Compatible Models (optional)">
                        <p className="text-xs text-muted-foreground mb-2">Select device models this part is compatible with.</p>
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                            {models.map(model => {
                                const id = model.id;
                                const isSelected = selectedCompatibleModels.some(m => m.id === id);
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => id && toggleCompatibleModel({ id, name: model.name })}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-sm border transition-colors",
                                            isSelected
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-background hover:bg-muted/50 border-border"
                                        )}
                                    >
                                        {model.name}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedCompatibleModels.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {selectedCompatibleModels.map(m => (
                                    <Badge key={m.id} variant="secondary" className="gap-1">
                                        {m.name}
                                        <button
                                            type="button"
                                            onClick={() => toggleCompatibleModel(m)}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </Field>
                </section>
            )}
        </div>
    );
}
