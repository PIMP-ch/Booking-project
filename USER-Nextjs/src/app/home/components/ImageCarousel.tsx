"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { SafeImage } from "./Booking";

// Carousel
export function ImageCarousel({
    images,
    alt,
}: {
    images: string[];
    alt?: string;
}) {
    const [index, setIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);

    useEffect(() => {
        setIndex(0);
    }, [images]);

    if (!images || images.length === 0) {
        return <SafeImage src="/images/stadium-placeholder.jpg" alt={alt || ""} />;
    }

    const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
    const next = () => setIndex((i) => (i + 1) % images.length);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEnd = e.changedTouches[0].clientX;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            next();
        } else if (isRightSwipe) {
            prev();
        }
    };

    return (
        <div
            className="relative w-full h-32 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <SafeImage src={images[index]} alt={alt || ""} />

            {images.length > 1 && (
                <>
                    <button
                        aria-label="previous"
                        onClick={prev}
                        className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded transition"
                    >
                        ‹
                    </button>
                    <button
                        aria-label="next"
                        onClick={next}
                        className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded transition"
                    >
                        ›
                    </button>
                </>
            )}
        </div>
    );
}
