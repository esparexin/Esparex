"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getListingById } from "@/lib/api/user/listings";
import { usePostAdAction } from "./PostAdContext";
import { Loader2 } from "lucide-react";

export function EditAdWrapper({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const id = params?.id as string | undefined;
    const { initializeFromListing, setLoadError } = usePostAdAction();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError("No listing ID provided in route");
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        async function fetchListing() {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getListingById(id as string);
                if (!data) {
                    throw new Error("Listing not found or you do not have permission to edit it.");
                }
                if (isMounted) {
                    await initializeFromListing(data);
                    // Ensure loading state clears in the component regardless
                    // of what initializeFromListing does to context state.
                    setIsLoading(false);
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to load listing for editing";
                if (isMounted) {
                    setError(message);
                    setLoadError(message);
                    setIsLoading(false);
                }
            }
        }

        fetchListing();

        return () => {
            isMounted = false;
        };
        // Now that initializeFromListing is stable (uses setListingImages, not imagesHook),
        // this effect will only re-run if id changes — no more infinite loop.
    }, [id, initializeFromListing, setLoadError]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading listing data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                <div className="bg-destructive/10 text-destructive p-6 rounded-lg max-w-md w-full">
                    <h3 className="font-semibold text-lg mb-2">Error Loading Listing</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="edit-ad-wrapper relative">
            <div className="bg-amber-50 border-b border-amber-200 p-4 text-amber-800 text-sm text-center">
                <strong>Editing Listing:</strong> Changes to title, description, price, or images may require re-approval.
            </div>
            {children}
        </div>
    );
}
