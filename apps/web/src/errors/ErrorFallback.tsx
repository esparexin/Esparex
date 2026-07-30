import { Button } from "@esparex/ui";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary?: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center p-4 py-8 text-center min-h-[40vh] w-full">
            <div className="w-full max-w-md rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-lg backdrop-blur-xl sm:p-8">
                <div className="mb-4 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 shadow-sm">
                        <AlertTriangle className="h-7 w-7" strokeWidth={2} />
                    </div>
                </div>
                <h2 className="text-lg font-extrabold text-foreground sm:text-xl mb-1.5">
                    Something went wrong
                </h2>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed mb-5">
                    {error?.message || "Please refresh the page to try again. If the issue persists, contact support."}
                </p>
                {resetErrorBoundary ? (
                    <Button
                        onClick={resetErrorBoundary}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 active:scale-95"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        <span>Try Again</span>
                    </Button>
                ) : (
                    <Button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 active:scale-95"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        <span>Refresh Page</span>
                    </Button>
                )}
            </div>
        </div>
    );
}
