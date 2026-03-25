"use client";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface ListingSuccessMessageProps {
    title: ReactNode;
    description: ReactNode;
    primaryActionLabel?: string;
    onPrimaryAction: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction: () => void;
}

export function ListingSuccessMessage({
    title,
    description,
    primaryActionLabel = "Go to My Listings",
    onPrimaryAction,
    secondaryActionLabel = "Post Another Listing",
    onSecondaryAction
}: ListingSuccessMessageProps) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-inter">
            <div className="bg-white max-w-sm w-full rounded-2xl p-8 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4 text-3xl">
                    ✅
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-xl font-bold text-slate-900 leading-tight">
                        {title}
                    </h1>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="space-y-3 pt-4">
                    <Button 
                        onClick={onPrimaryAction}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 rounded-xl"
                    >
                        {primaryActionLabel}
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={onSecondaryAction}
                        className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold h-12 rounded-xl"
                    >
                        {secondaryActionLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
