"use client";

import { useEffect, useRef } from "react";

export default function CursorBloom() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const positionRef = useRef({ x: 0, y: 0 }); // Target position (mouse)
    const currentRef = useRef({ x: 0, y: 0 }); // Current position (lerped)
    const lastMoveRef = useRef(0); // Timestamp of last movement
    const isVisibleRef = useRef(false); // Visibility state

    // customization
    const BLOOM_SIZE = 400; // px
    const BLOOM_COLOR = "rgba(255, 183, 77, 0.4)"; // Soft orange/yellow spacing
    const BLUR_AMOUNT = "80px";
    const LERP_FACTOR = 0.12; // Smoothness (0.1 = slow, 0.2 = fast)
    const FADE_TIMEOUT = 1000; // ms before fading out

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;

        // Detect if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) return;

        let requestID: number;

        const onMouseMove = (e: MouseEvent) => {
            positionRef.current = { x: e.clientX, y: e.clientY };
            lastMoveRef.current = Date.now();

            if (!isVisibleRef.current) {
                isVisibleRef.current = true;
                cursor.style.opacity = "1";
            }
        };

        const updatePosition = () => {
            // Linear interpolation for smooth movement
            currentRef.current.x += (positionRef.current.x - currentRef.current.x) * LERP_FACTOR;
            currentRef.current.y += (positionRef.current.y - currentRef.current.y) * LERP_FACTOR;

            // Update transform
            // Center the bloom on the cursor
            const x = currentRef.current.x - BLOOM_SIZE / 2;
            const y = currentRef.current.y - BLOOM_SIZE / 2;

            cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;

            // Fade out logic
            if (isVisibleRef.current && Date.now() - lastMoveRef.current > FADE_TIMEOUT) {
                isVisibleRef.current = false;
                cursor.style.opacity = "0";
            }

            requestID = requestAnimationFrame(updatePosition);
        };

        window.addEventListener("mousemove", onMouseMove);
        requestID = requestAnimationFrame(updatePosition);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            cancelAnimationFrame(requestID);
        };
    }, []);

    return (
        <div
            ref={cursorRef}
            className="fixed top-0 left-0 pointer-events-none z-1 mix-blend-multiply will-change-transform transition-opacity duration-300 ease-out"
            style={{
                width: BLOOM_SIZE,
                height: BLOOM_SIZE,
                background: `radial-gradient(circle, ${BLOOM_COLOR} 0%, rgba(255,255,255,0) 60%)`,
                filter: `blur(${BLUR_AMOUNT})`,
                opacity: 0, // Start hidden
            }}
        />
    );
}
