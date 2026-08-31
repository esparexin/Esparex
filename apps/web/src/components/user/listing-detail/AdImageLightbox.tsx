"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Maximize } from "@/icons/IconRegistry";

interface AdImageLightboxProps {
    isOpen: boolean;
    images: string[];
    currentIndex: number;
    title: string;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}

const SWIPE_THRESHOLD = 50; // px

export function AdImageLightbox({
    isOpen,
    images,
    currentIndex,
    title,
    onClose,
    onNext,
    onPrev,
}: AdImageLightboxProps) {
    const [isZoomed, setIsZoomed] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const lastTapTimeRef = useRef<number>(0);
    const lightboxRef = useRef<HTMLDivElement>(null);

    const toggleZoom = useCallback(() => {
        setIsZoomed((prev) => !prev);
    }, []);

    const handleNext = useCallback(() => {
        setIsZoomed(false);
        onNext();
    }, [onNext]);

    const handlePrev = useCallback(() => {
        setIsZoomed(false);
        onPrev();
    }, [onPrev]);

    const handleClose = useCallback(() => {
        setIsZoomed(false);
        onClose();
    }, [onClose]);

    // Keyboard navigation, body scroll locking, and focus trapping
    useEffect(() => {
        if (!isOpen) return;

        const originalBodyOverflow = document.body.style.overflow;
        const originalDocOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.body.classList.add("overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                handleClose();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                handlePrev();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                handleNext();
            } else if (e.key === "Tab" && lightboxRef.current) {
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
    }, [isOpen, handleClose, handleNext, handlePrev]);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isZoomed) return;
        touchStartX.current = e.touches[0]?.clientX ?? null;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        // Double-tap zoom detection for mobile
        const now = Date.now();
        if (now - lastTapTimeRef.current < 300) {
            toggleZoom();
            lastTapTimeRef.current = 0;
            return;
        }
        lastTapTimeRef.current = now;

        if (isZoomed || touchStartX.current === null) return;
        const diff = touchStartX.current - (e.changedTouches[0]?.clientX ?? 0);
        if (Math.abs(diff) >= SWIPE_THRESHOLD) {
            if (diff > 0) {
                onNext();
            } else {
                onPrev();
            }
        }
        touchStartX.current = null;
    };

    if (!isOpen) return null;

    const currentImage = images[currentIndex] || "";

    return (
        <div
            ref={lightboxRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md overscroll-contain select-none touch-pan-y"
            onClick={handleClose}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="dialog"
            aria-modal="true"
            aria-label={`Fullscreen image gallery: ${title}`}
        >
            <div className="sr-only" aria-live="polite">
                Image {currentIndex + 1} of {images.length}
            </div>

            {/* Top Toolbar */}
            <div
                className="absolute top-4 right-4 flex items-center gap-2 z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={toggleZoom}
                    className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                    aria-label={isZoomed ? "Zoom out" : "Zoom in"}
                >
                    <Maximize className={`h-5 w-5 transition-transform ${isZoomed ? "scale-90 opacity-75" : "scale-100"}`} />
                </button>
                <button
                    type="button"
                    onClick={handleClose}
                    className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                    aria-label="Close image viewer"
                    autoFocus
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Counter Badge */}
            {images.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 border border-white/10 text-white text-caption font-semibold px-3.5 py-1 rounded-full pointer-events-none">
                    {currentIndex + 1} / {images.length}
                </div>
            )}

            {/* Main Interactive Zoomable Image Area */}
            <div
                className="relative flex items-center justify-center w-full h-full max-w-6xl max-h-[88vh] mx-2 sm:mx-4 overflow-hidden"
                onClick={(e) => {
                    e.stopPropagation();
                    toggleZoom();
                }}
            >
                <img
                    src={currentImage}
                    alt={`Fullscreen photo ${currentIndex + 1} of ${images.length}: ${title}`}
                    className={`max-h-[85vh] max-w-[92vw] object-contain rounded-xl shadow-2xl transition-transform duration-200 cursor-zoom-in ${
                        isZoomed ? "scale-175 sm:scale-200 cursor-zoom-out" : "scale-100"
                    }`}
                />
            </div>

            {/* Prev / Next Navigation Chevrons */}
            {images.length > 1 && !isZoomed && (
                <>
                    <button
                        type="button"
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 flex items-center justify-center text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePrev();
                        }}
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 flex items-center justify-center text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNext();
                        }}
                        aria-label="Next image"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </>
            )}
        </div>
    );
}
