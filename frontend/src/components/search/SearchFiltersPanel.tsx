"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MapPin, Tag, Smartphone, IndianRupee } from "lucide-react";

type SpecificFilterOption = {
  value: string;
  label: string;
};

export type SpecificFilter = {
  name: string;
  type: "checkbox";
  options?: SpecificFilterOption[];
};

interface SearchFiltersPanelProps {
  selectedCategory: string | null;
  priceRange: [number, number];
  setPriceRange: (val: [number, number]) => void;
  selectedBrands: string[];
  setSelectedBrands: (val: string[]) => void;
  availableBrands: string[];
  categoryFilters: Record<string, string[]>;
  setCategoryFilters: (val: Record<string, string[]>) => void;
  radiusKm: number;
  setRadiusKm: (val: number) => void;
  dynamicSpecificFilters?: SpecificFilter[];
  onApply?: () => void;
  onReset: () => void;
}

export function SearchFiltersPanel({
  selectedCategory,
  priceRange,
  setPriceRange,
  selectedBrands,
  setSelectedBrands,
  availableBrands,
  categoryFilters,
  setCategoryFilters,
  radiusKm = 50,
  setRadiusKm,
  dynamicSpecificFilters = [],
  onApply,
  onReset,
}: SearchFiltersPanelProps) {
  const renderSpecificFilters = () => {
    if (!selectedCategory || dynamicSpecificFilters.length === 0) return null;

    return (
      <AccordionItem value="specs" className="border-none">
        <AccordionTrigger className="hover:no-underline py-3">
          <div className="flex items-center gap-2">
            <Smartphone className="size-4 text-blue-500" />
            <span className="font-semibold text-sm">{selectedCategory} Specs</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          {dynamicSpecificFilters.map((filter) => (
            <div key={filter.name} className="space-y-3">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {filter.name}
              </Label>

              {filter.type === "checkbox" && filter.options && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                  {filter.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${filter.name}-${option.value}`}
                        checked={categoryFilters[filter.name]?.includes(option.value) || false}
                        onCheckedChange={(checked) => {
                          const currentValues = categoryFilters[filter.name] || [];
                          if (checked) {
                            setCategoryFilters({
                              ...categoryFilters,
                              [filter.name]: [...currentValues, option.value],
                            });
                          } else {
                            setCategoryFilters({
                              ...categoryFilters,
                              [filter.name]: currentValues.filter((v) => v !== option.value),
                            });
                          }
                        }}
                      />
                      <label
                        htmlFor={`${filter.name}-${option.value}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <Accordion type="multiple" defaultValue={["price", "brands", "specs"]} className="flex-1">
        <AccordionItem value="price" className="border-none">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <IndianRupee className="size-4 text-green-600" />
              <span className="font-semibold text-sm">Price Range</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-1 pt-2 pb-6">
            <Slider
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              max={200000}
              step={1000}
              className="mb-6"
            />
            <div className="flex justify-between items-center text-xs">
              <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 font-medium">
                ₹{priceRange[0].toLocaleString()}
              </div>
              <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 font-medium">
                ₹{priceRange[1].toLocaleString()}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {availableBrands.length > 0 && (
          <AccordionItem value="brands" className="border-none">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-purple-600" />
                <span className="font-semibold text-sm">Brands</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 max-h-56 overflow-y-auto pr-2 scrollbar-hide">
              {availableBrands.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedBrands([...selectedBrands, brand]);
                      } else {
                        setSelectedBrands(selectedBrands.filter((b) => b !== brand));
                      }
                    }}
                  />
                  <label htmlFor={`brand-${brand}`} className="text-sm font-medium leading-none cursor-pointer">
                    {brand}
                  </label>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="radius" className="border-none">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-cyan-600" />
              <span className="font-semibold text-sm">Search Radius</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-1 pt-2 pb-6">
            <Slider
              value={[radiusKm]}
              onValueChange={(val) => setRadiusKm(val[0] ?? 50)}
              min={5}
              max={500}
              step={5}
              className="mb-6"
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">5 km</span>
              <div className="bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-lg border border-cyan-100 font-medium">
                {radiusKm} km
              </div>
              <span className="text-slate-500">500 km</span>
            </div>
          </AccordionContent>
        </AccordionItem>

        {renderSpecificFilters()}
      </Accordion>

      <div className="pt-6 mt-auto border-t space-y-3">
        {onApply && (
          <Button className="w-full h-11 bg-slate-900 hover:bg-slate-800" onClick={onApply}>
            Apply Filters
          </Button>
        )}

        <Button
          variant="ghost"
          className="w-full h-11 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          onClick={onReset}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
