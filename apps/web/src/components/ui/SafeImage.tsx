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
  unoptimized,
  ...props
}: SafeImageProps) {
  const [errorSrc, setErrorSrc] = useState<string | null>(null);

  // Derive currentSrc
  const currentSrc = (errorSrc === src) ? fallback : src;

  const handleError = () => {
    if (errorSrc === src) return; // Prevent infinite fallback loops
    setErrorSrc(src as string);
  };

  // Direct S3 & external CDN URLs skip local Next.js image proxying to prevent 400 errors and lower server overhead
  const isExternalS3 = (() => {
    if (typeof currentSrc !== "string") return false;
    try {
      if (currentSrc.startsWith("http://") || currentSrc.startsWith("https://")) {
        const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
        const url = new URL(currentSrc, base);
        // Local relative assets or same-origin paths do not need unoptimized flag
        if (typeof window !== "undefined" && url.origin === window.location.origin) {
          return false;
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  })();

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized={unoptimized ?? isExternalS3}
      onError={handleError}
      className={cn(
        "transition-opacity duration-300",
        errorSrc !== null && "opacity-80 grayscale-[0.5]",
        className
      )}
    />
  );
}
