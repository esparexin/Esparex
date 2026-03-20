import { Button } from "@/components/ui/button";

interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary?: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-red-50/50 rounded-xl border border-red-100 m-4">
            <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong.</h2>
            <p className="text-red-500 mb-6 text-sm max-w-md">
                {error?.message || "Please refresh the page to try again. If the issue persists, contact support."}
            </p>
            {resetErrorBoundary ? (
                <Button onClick={resetErrorBoundary} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 transition-colors">
                    Try Again
                </Button>
            ) : (
                <Button onClick={() => window.location.reload()} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 transition-colors">
                    Refresh Page
                </Button>
            )}
        </div>
    );
}
