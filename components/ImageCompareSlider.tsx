import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageCompareSliderProps {
    originalImage: string;
    modifiedImage: string;
}

const ImageCompareSlider: React.FC<ImageCompareSliderProps> = ({ originalImage, modifiedImage }) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null); // Ref for the visible image
    const isDragging = useRef(false);

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current || !imageRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const imageRect = imageRef.current.getBoundingClientRect();

        // If image has no width (e.g., not loaded/visible), do nothing.
        if (imageRect.width === 0) return;

        // Calculate cursor's X position relative to the image's left edge.
        const xOnImage = clientX - imageRect.left;

        // Clamp the position to be within the image's bounds (0 to image.width).
        const clampedX = Math.max(0, Math.min(xOnImage, imageRect.width));

        // Calculate the absolute pixel position of the slider from the container's left edge.
        // This is the image's offset within the container, plus the clamped cursor position on the image.
        const imageOffsetLeft = imageRect.left - containerRect.left;
        const sliderPixelPos = imageOffsetLeft + clampedX;

        // Convert the absolute pixel position to a percentage of the container's width.
        // This percentage will correctly position the slider handle and clip-path relative to the container.
        const percent = (sliderPixelPos / containerRect.width) * 100;
        
        setSliderPosition(percent);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current) return;
        handleMove(e.clientX);
    }, [handleMove]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging.current) return;
        e.preventDefault();
        handleMove(e.touches[0].clientX);
    }, [handleMove]);

    const handleEnd = useCallback(() => {
        isDragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchend', handleEnd);
    }, [handleMouseMove, handleTouchMove]);

    const handleStart = useCallback(() => {
        isDragging.current = true;
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);
    }, [handleMouseMove, handleTouchMove, handleEnd]);

    useEffect(() => {
        return () => {
             // Cleanup listeners when component unmounts
            if (isDragging.current) {
                handleEnd();
            }
        };
    }, [handleEnd]);

    return (
        <div 
            ref={containerRef}
            className="relative w-full max-w-full mx-auto select-none overflow-hidden rounded-lg shadow-xl border"
        >
            <img 
                ref={imageRef}
                src={modifiedImage} 
                alt="Modified" 
                className="block w-full h-auto max-h-[70vh] object-contain pointer-events-none"
                draggable={false}
            />
            <div 
                className="absolute inset-0 w-full h-full overflow-hidden" 
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <img 
                    src={originalImage} 
                    alt="Original" 
                    className="block w-full h-auto max-h-[70vh] object-contain pointer-events-none"
                    draggable={false}
                />
            </div>
            <div 
                className="absolute top-0 bottom-0 w-1 bg-white/75 cursor-ew-resize"
                style={{ left: `calc(${sliderPosition}% - 0.5px)` }}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
            >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-full h-10 w-10 flex items-center justify-center shadow-lg border-2 border-white/50">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5 5-5m2 10l5-5-5-5"></path></svg>
                </div>
            </div>
        </div>
    );
};

export default ImageCompareSlider;