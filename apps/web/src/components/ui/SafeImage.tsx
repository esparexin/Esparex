"use client";

import { useState } from "react";
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
  const [errorSrc, setErrorSrc] = useState<string | null>(null);

  // Derive currentSrc
  const currentSrc = (errorSrc === src) ? fallback : src;

  const handleError = () => {
    if (errorSrc === src) return; // Prevent infinite fallback loops
    setErrorSrc(src as string);
  };

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={handleError}
      className={cn(
        "transition-opacity duration-300",
        errorSrc !== null && "opacity-80 grayscale-[0.5]",
        className
      )}
    />
  );
}
