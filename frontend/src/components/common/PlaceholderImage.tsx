import { useState } from "react";
import Image from "next/image";
import { ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toSafeImageSrc } from "@/lib/image/imageUrl";

interface PlaceholderImageProps {
    src?: string | null;
    alt?: string;
    className?: string;
    containerClassName?: string;
    iconClassName?: string;
    text?: string;
    fallbackIcon?: React.ReactNode;
    sizes?: string;
    priority?: boolean;
}

/**
 * A robust image component that handles loading states and errors gracefully.
 * Replaces hardcoded Unsplash placeholders with a clean, branded empty state.
 */
export function PlaceholderImage({
    src,
    alt,
    className,
    containerClassName,
    iconClassName,
    text,
    fallbackIcon,
    sizes = "100vw",
    priority = false,
}: PlaceholderImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const safeSrc = toSafeImageSrc(src, "").trim();

    // If no src is provided, show fallback immediately
    if (!safeSrc) {
        return (
            <div className={cn("flex flex-col items-center justify-center bg-muted text-muted-foreground min-h-[150px] w-full rounded-md", containerClassName)}>
                {fallbackIcon || <ImageOff className={cn("h-8 w-8 mb-2 opacity-50", iconClassName)} />}
                {text && <span className="text-xs font-medium opacity-70">{text}</span>}
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden bg-muted", containerClassName)}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
                </div>
            )}

            {!hasError ? (
                <Image
                    src={safeSrc}
                    alt={alt || "Image"}
                    className={cn(
                        "object-cover transition-opacity duration-300",
                        isLoading ? "opacity-0" : "opacity-100",
                        className
                    )}
                    fill
                    unoptimized
                    sizes={sizes}
                    priority={priority}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setHasError(true);
                    }}
                />
            ) : (
                <div className={cn("flex flex-col items-center justify-center w-full h-full bg-muted text-muted-foreground p-4", className)}>
                    {fallbackIcon || <ImageOff className={cn("h-8 w-8 mb-2 opacity-50", iconClassName)} />}
                    {text && <span className="text-xs font-medium opacity-70 text-center">{text}</span>}
                </div>
            )}
        </div>
    );
}
