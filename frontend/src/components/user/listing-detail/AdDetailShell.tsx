import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, SearchX, RefreshCcw } from "lucide-react";
import { AdDetailSkeleton } from "./AdDetailSkeleton";
import { ROUTES } from "@/lib/logic/routes";
import { useRouter } from "next/navigation";

interface ListingDetailShellProps {
    isLoading: boolean;
    error?: string | null;
    notFound?: boolean;
    onRetry?: () => void;
    children: React.ReactNode;
}

export function ListingDetailShell({
    isLoading,
    error,
    notFound,
    onRetry,
    children,
}: ListingDetailShellProps) {
    const router = useRouter();

    if (isLoading) {
        return <AdDetailSkeleton />;
    }

    // Not Found State
    if (notFound) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <SearchX className="h-8 w-8 text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h2>
                <p className="text-gray-500 max-w-md mb-6">
                    The listing you are looking for might have been removed, expired, or the link is incorrect.
                </p>
                <Button onClick={() => void router.push(ROUTES.BROWSE)} variant="default">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Browse All Listings
                </Button>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Listing</h2>
                <p className="text-gray-500 max-w-md mb-6">
                    {error || "We encountered an unexpected error while loading this listing. Please try again."}
                </p>
                <div className="flex gap-3">
                    <Button onClick={() => void router.push(ROUTES.HOME)} variant="outline">
                        Go Home
                    </Button>
                    {onRetry && (
                        <Button onClick={onRetry}>
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // Content State
    return <>{children}</>;
}
