"use client";

import { useState, useRef, useCallback } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Button } from "@esparex/ui";
import { Share2, Heart, ChevronLeft, ChevronRight } from "@/icons/IconRegistry";
import { DEFAULT_IMAGE_PLACEHOLDER, toSafeImageArray } from "@/lib/image/imageUrl";
import { MARKETPLACE_CARD_FILL_SIZES } from "@/lib/imageSizes";
import { AdImageLightbox } from "./AdImageLightbox";

interface AdImageCarouselProps {
    images: string[];
    title: string;
    isFavorited: boolean;
    onFavorite: () => void;
    onShare: () => void;
    showActionButtons?: boolean;
}

const SWIPE_THRESHOLD = 40; // px

export function AdImageCarousel({
    images,
    title,
    isFavorited,
    onFavorite,
    onShare,
    showActionButtons = true,
}: AdImageCarouselProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const touchStartX = useRef<number | null>(null);

    const normalizedImages = toSafeImageArray(images);
    const safeImages = normalizedImages.length > 0 ? normalizedImages : [DEFAULT_IMAGE_PLACEHOLDER];

    const nextImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev + 1) % safeImages.length);
    }, [safeImages.length]);

    const prevImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    }, [safeImages.length]);

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
        <section aria-label="Listing image gallery" className="w-full space-y-2.5">
            <div
                className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[440px] bg-muted/60 dark:bg-card/80 rounded-2xl overflow-hidden group/main cursor-pointer flex items-center justify-center border border-border/80 shadow-2xs select-none"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onClick={() => setIsLightboxOpen(true)}
                role="button"
                aria-label={`View fullscreen photo ${currentImageIndex + 1} of ${safeImages.length} for ${title}`}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setIsLightboxOpen(true);
                    }
                }}
            >
                {/* Ambient Blurred Background (Ensures portrait/irregular images blend smoothly without black bars) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                    <SafeImage
                        src={safeImages[currentImageIndex]!}
                        alt=""
                        fill
                        sizes="100vw"
                        className="w-full h-full object-cover scale-110 blur-2xl opacity-35 dark:opacity-20 transition-all duration-300"
                    />
                </div>

                {/* Primary Sharp Uncropped Foreground Image */}
                <div className="relative z-1 w-full h-full p-2 sm:p-3 flex items-center justify-center">
                    <SafeImage
                        src={safeImages[currentImageIndex]!}
                        alt={`Listing image ${currentImageIndex + 1} of ${safeImages.length}: ${title}`}
                        fill
                        sizes={MARKETPLACE_CARD_FILL_SIZES}
                        priority
                        className="w-full h-full object-contain drop-shadow-xs transition-transform duration-300 group-hover/main:scale-[1.01]"
                    />
                </div>

                {/* Top Action Buttons (Share & Favorite) */}
                {showActionButtons && (
                    <div className="absolute top-2.5 right-2.5 z-10 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-9 w-9 rounded-full bg-white/90 dark:bg-black/75 backdrop-blur-md hover:bg-white dark:hover:bg-black shadow-sm border border-border/40 transition-all active:scale-90 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
                            onClick={onShare}
                            aria-label="Share this listing"
                        >
                            <Share2 className="h-4 w-4 text-foreground" />
                        </Button>
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-9 w-9 rounded-full bg-white/90 dark:bg-black/75 backdrop-blur-md hover:bg-white dark:hover:bg-black shadow-sm border border-border/40 transition-all active:scale-90 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
                            onClick={onFavorite}
                            aria-label={isFavorited ? "Remove from saved ads" : "Save this listing"}
                        >
                            <Heart
                                className={`h-4 w-4 transition-colors ${
                                    isFavorited ? "fill-red-500 text-red-500" : "text-foreground"
                                }`}
                            />
                        </Button>
                    </div>
                )}

                {/* Counter & Swipe Dots Overlay */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-tiny px-3 py-1 rounded-full font-medium pointer-events-none">
                    <span>{currentImageIndex + 1} / {safeImages.length}</span>
                </div>

                {/* Persistent Navigation Chevrons */}
                {safeImages.length > 1 && (
                    <>
                        <button
                            type="button"
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/40 hover:bg-black/65 active:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                prevImage();
                            }}
                            aria-label="Previous photo"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/40 hover:bg-black/65 active:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                nextImage();
                            }}
                            aria-label="Next photo"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}
            </div>

            {/* Thumbnail Carousel Row */}
            {safeImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide" role="tablist" aria-label="Photo thumbnails">
                    {safeImages.map((image: string, index: number) => (
                        <button
                            key={index}
                            type="button"
                            role="tab"
                            aria-selected={index === currentImageIndex}
                            onClick={() => setCurrentImageIndex(index)}
                            aria-label={`View photo ${index + 1} of ${safeImages.length}`}
                            className={`shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden border-2 transition-all duration-200 relative focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                                index === currentImageIndex
                                    ? "border-primary ring-2 ring-primary/20 scale-95 opacity-100"
                                    : "border-border/60 hover:border-border opacity-70 hover:opacity-100"
                            }`}
                        >
                            <SafeImage
                                src={image}
                                alt={`Thumbnail ${index + 1}`}
                                fill
                                sizes="80px"
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Lightbox Modal */}
            <AdImageLightbox
                isOpen={isLightboxOpen}
                images={safeImages}
                currentIndex={currentImageIndex}
                title={title}
                onClose={() => setIsLightboxOpen(false)}
                onNext={nextImage}
                onPrev={prevImage}
            />
        </section>
    );
}
