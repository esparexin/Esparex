"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import {
    Dialog,
    DialogPortal,
    DialogTitle,
} from "@esparex/ui";
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

    // Keyboard arrow navigation (Escape and Tab focus trapping are handled automatically by Radix Dialog)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                handlePrev();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                handleNext();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, handleNext, handlePrev]);

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
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogPortal>
                {/* Full-bleed Backdrop Overlay */}
                <RadixDialog.Overlay
                    className="fixed inset-0 z-[1050] bg-black/95 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200"
                />

                {/* Dialog Content Frame */}
                <RadixDialog.Content
                    className="fixed inset-0 z-[1051] flex items-center justify-center overscroll-contain select-none touch-pan-y outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200"
                    onClick={handleClose}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    aria-label={`Fullscreen image gallery: ${title}`}
                >
                    <DialogTitle className="sr-only">
                        {`Fullscreen image gallery: ${title}`}
                    </DialogTitle>

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
                </RadixDialog.Content>
            </DialogPortal>
        </Dialog>
    );
}

