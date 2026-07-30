"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button, Z_INDEX } from "@esparex/ui";
import { Share2, Heart, ChevronLeft, ChevronRight } from "@/icons/IconRegistry";
import { DEFAULT_IMAGE_PLACEHOLDER, toSafeImageArray } from "@/lib/image/imageUrl";
import { MARKETPLACE_CARD_FILL_SIZES } from "@/lib/imageSizes";

interface AdImageCarouselProps {
    images: string[];
    title: string;
    isFavorited: boolean;
    onFavorite: () => void;
    onShare: () => void;
    showActionButtons?: boolean;
}

const SWIPE_THRESHOLD = 50; // px

export function AdImageCarousel({ images, title, isFavorited, onFavorite, onShare, showActionButtons = true }: AdImageCarouselProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const triggerElementRef = useRef<HTMLElement | null>(null);
    const lightboxRef = useRef<HTMLDivElement>(null);

    const normalizedImages = toSafeImageArray(images);
    const safeImages = normalizedImages.length > 0 ? normalizedImages : [DEFAULT_IMAGE_PLACEHOLDER];

    const nextImage = useCallback(() => {
        setCurrentImageIndex((prev: number) => (prev + 1) % safeImages.length);
    }, [safeImages.length]);

    const prevImage = useCallback(() => {
        setCurrentImageIndex((prev: number) => (prev - 1 + safeImages.length) % safeImages.length);
    }, [safeImages.length]);

    const openLightbox = (e?: React.SyntheticEvent) => {
        if (e) {
            triggerElementRef.current = e.currentTarget as HTMLElement;
        } else {
            triggerElementRef.current = document.activeElement as HTMLElement;
        }
        setIsLightboxOpen(true);
    };

    const closeLightbox = useCallback(() => {
        setIsLightboxOpen(false);
        if (triggerElementRef.current) {
            triggerElementRef.current.focus();
            triggerElementRef.current = null;
        }
    }, []);

    // Handle Keyboard navigation, Body & Document Scroll Lock, Focus Restoration
    useEffect(() => {
        if (!isLightboxOpen) return;

        // Complete Body & HTML Scroll Lock
        const originalBodyOverflow = document.body.style.overflow;
        const originalDocOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.body.classList.add("overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                closeLightbox();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                prevImage();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                nextImage();
            } else if (e.key === "Tab" && lightboxRef.current) {
                // Focus Trap
                const focusables = lightboxRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusables.length === 0) return;
                const firstElement = focusables[0]!;
                const lastElement = focusables[focusables.length - 1]!;

                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.documentElement.style.overflow = originalDocOverflow;
            document.body.classList.remove("overflow-hidden");
            document.documentElement.classList.remove("overflow-hidden");
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isLightboxOpen, closeLightbox, nextImage, prevImage]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - (e.changedTouches[0]?.clientX ?? 0);
        if (Math.abs(diff) >= SWIPE_THRESHOLD) {
            if (diff > 0) {
                nextImage();
            } else {
                prevImage();
            }
        }
        touchStartX.current = null;
    };

    return (
        <>
        <Card className="rounded-none md:rounded-[2.5rem] overflow-hidden border-none shadow-none md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white md:p-2">
            <CardContent className="p-0">
                <div
                    className="relative aspect-[4/3] md:aspect-[16/10] bg-slate-100 rounded-none md:rounded-[2rem] overflow-hidden group/main cursor-pointer"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onClick={openLightbox}
                    role="button"
                    aria-label={`View full-size image gallery for ${title}`}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openLightbox(e); }}
                >
                    <Image
                        src={safeImages[currentImageIndex]!}
                        alt={`Listing image ${currentImageIndex + 1} of ${safeImages.length}: ${title}`}
                        fill
                        sizes={MARKETPLACE_CARD_FILL_SIZES}
                        priority
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/main:scale-105"
                    />

                    {/* Share and Favorite Buttons */}
                    {showActionButtons && (
                        <div className="absolute top-3 right-3 md:top-4 md:right-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="h-11 w-11 rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-lg border-none transition-all active:scale-90"
                                onClick={onShare}
                                aria-label="Share this ad"
                            >
                                <Share2 className="h-4 w-4 text-foreground-tertiary" />
                            </Button>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="h-11 w-11 rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-lg border-none transition-all active:scale-90"
                                onClick={onFavorite}
                                aria-label="Add to favorites"
                            >
                                <Heart
                                    className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-foreground-tertiary"}`}
                                />
                            </Button>
                        </div>
                    )}

                    {/* Image counter pill */}
                    {safeImages.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                            {currentImageIndex + 1} / {safeImages.length}
                        </div>
                    )}

                    {/* Navigation Arrows */}
                    {safeImages.length > 1 && (
                        <>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-lg border-none md:opacity-0 md:group-hover/main:opacity-100 transition-all active:scale-90"
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-foreground-tertiary" />
                            </Button>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-lg border-none md:opacity-0 md:group-hover/main:opacity-100 transition-all active:scale-90"
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                aria-label="Next image"
                            >
                                <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-foreground-tertiary" />
                            </Button>
                        </>
                    )}
                </div>

                {/* Thumbnail Carousel */}
                {safeImages.length > 1 && (
                    <div className="px-3 py-3 md:px-4 md:py-4 bg-transparent">
                        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 scrollbar-hide">
                            {safeImages.map((image: string, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    aria-label={`View photo ${index + 1} of ${safeImages.length}`}
                                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden border-2 transition-all duration-200 relative ${
                                        index === currentImageIndex
                                            ? "border-green-500 ring-2 ring-green-100 scale-95"
                                            : "border-transparent hover:border-slate-300 opacity-50 hover:opacity-100"
                                    }`}
                                >
                                    <Image
                                        src={image}
                                        alt={`Thumbnail ${index + 1} of ${safeImages.length} for ${title}`}
                                        fill
                                        sizes="80px"
                                        unoptimized
                                        className="object-cover"
                                    />
                                    {index === currentImageIndex && (
                                        <div className="absolute inset-0 bg-green-500/5" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Lightbox / Fullscreen overlay */}
        {isLightboxOpen && (
            <div
                ref={lightboxRef}
                style={{ zIndex: Z_INDEX.drawerOverlay }}
                className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm overscroll-contain touch-none select-none"
                onClick={closeLightbox}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                role="dialog"
                aria-modal="true"
                aria-label={`Fullscreen image gallery: ${title}`}
            >
                {/* Screen reader live announcement */}
                <div className="sr-only" aria-live="polite">
                    Image {currentImageIndex + 1} of {safeImages.length}
                </div>

                {/* Close button */}
                <button
                    className="absolute top-4 right-4 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    onClick={closeLightbox}
                    aria-label="Close image viewer"
                    autoFocus
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Counter */}
                {safeImages.length > 1 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm font-semibold px-3 py-1 rounded-full">
                        {currentImageIndex + 1} / {safeImages.length}
                    </div>
                )}

                {/* Main image */}
                <div
                    className="relative flex items-center justify-center w-full max-w-5xl max-h-[85vh] mx-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <img
                        src={safeImages[currentImageIndex]!}
                        alt={`Fullscreen photo ${currentImageIndex + 1} of ${safeImages.length}: ${title}`}
                        className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl mx-auto shadow-2xl"
                    />
                </div>

                {/* Nav arrows */}
                {safeImages.length > 1 && (
                    <>
                        <button
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </>
                )}
            </div>
        )}
    </>
    );
}

