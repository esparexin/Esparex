"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { DEFAULT_IMAGE_PLACEHOLDER } from "@/lib/image/imageUrl";
import { cn } from "@/lib/utils";

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

  // Phase 1 (LCP): Enable Next.js image optimization for S3/external URLs.
  // Previously, all external URLs were forced to unoptimized=true to "prevent
  // 400 errors", but next.config.mjs already configures S3 remotePatterns,
  // and unoptimized bypasses resizing/WebP/srcset — the #1 LCP contributor
  // (10.6s). The onError fallback handles any optimization failures gracefully.
  // Only honor an explicit unoptimized prop; do not auto-bypass.
  const shouldUnoptimize = unoptimized === true;

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      loading={props.priority ? "eager" : props.loading}
      unoptimized={shouldUnoptimize}
      onError={handleError}
      className={cn(
        "transition-opacity duration-300",
        errorSrc !== null && "opacity-80 grayscale-[0.5]",
        className
      )}
    />
  );
}
