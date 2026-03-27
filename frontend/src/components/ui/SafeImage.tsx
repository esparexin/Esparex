"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { DEFAULT_IMAGE_PLACEHOLDER } from "@/lib/image/imageUrl";
import { cn } from "@/components/ui/utils";

/**
 * Robust Image Rendering Wrapper
 * - Handles 403/404/Network errors from S3 or external hosts gracefully
 * - Switches to a standard placeholder if the primary image fails to load
 * - Ensures no 'Broken Image' icons are shown to users
 */

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallback?: string;
  className?: string;
}

export function SafeImage({
  src,
  alt,
  fallback = DEFAULT_IMAGE_PLACEHOLDER,
  className,
  ...props
}: SafeImageProps) {
  const [errorStatus, setErrorStatus] = useState<"none" | "errored">("none");
  const [currentSrc, setCurrentSrc] = useState(src);

  // Sync internal src if the prop changes (e.g. from parent state update)
  useEffect(() => {
    setCurrentSrc(src);
    setErrorStatus("none");
  }, [src]);

  const handleError = () => {
    if (errorStatus === "errored") return; // Prevent infinite fallback loops
    
    setErrorStatus("errored");
    setCurrentSrc(fallback);
  };

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={handleError}
      className={cn(
        "transition-opacity duration-300",
        errorStatus === "errored" && "opacity-80 grayscale-[0.5]",
        className
      )}
    />
  );
}
