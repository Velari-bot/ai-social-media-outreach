"use client";

import { useEffect, useRef } from "react";

interface AmbientBloomsProps {
    bloomCount?: number;
    baseColor?: string;
    enableMouseInteraction?: boolean;
}

interface Bloom {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
}

export default function AmbientBlooms({
    bloomCount = 8,
    enableMouseInteraction = true,
}: AmbientBloomsProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bloomsRef = useRef<Bloom[]>([]);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const animationFrameRef = useRef<number>(0);

    // Modern, vibrant SaaS colors (Orange, Blue, Red, Yellow)
    const colors = [
        "rgba(255, 183, 77, 0.15)",  // Soft Orange
        "rgba(64, 196, 255, 0.12)",   // Soft Blue
        "rgba(255, 82, 82, 0.1)",     // Soft Red
        "rgba(255, 215, 64, 0.12)",    // Soft Yellow
    ];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        let width = 0;
        let height = 0;

        const initBlooms = () => {
            bloomsRef.current = Array.from({ length: bloomCount }).map(() => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.4, // Gentle drift
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 300 + 200, // Large, soft blobs
                color: colors[Math.floor(Math.random() * colors.length)],
            }));
        };

        const handleResize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                width = parent.clientWidth;
                height = parent.clientHeight;
                canvas.width = width;
                canvas.height = height;

                // Re-distribute blooms if they haven't been initialized or screen changed drastically
                if (bloomsRef.current.length === 0) {
                    initBlooms();
                }
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!enableMouseInteraction) return;
            // Get relative coordinates if inside a container, but here we assume fixed/absolute full screen likely
            // For general usage, pageX/Y is safest for a background
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        const animate = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, width, height);

            bloomsRef.current.forEach((bloom) => {
                // 1. Natural drift
                bloom.x += bloom.vx;
                bloom.y += bloom.vy;

                // Bounce off edges gently
                if (bloom.x < -bloom.radius) bloom.vx = Math.abs(bloom.vx);
                if (bloom.x > width + bloom.radius) bloom.vx = -Math.abs(bloom.vx);
                if (bloom.y < -bloom.radius) bloom.vy = Math.abs(bloom.vy);
                if (bloom.y > height + bloom.radius) bloom.vy = -Math.abs(bloom.vy);

                // 2. Mouse interaction (Parallax / Avoidance / Attraction)
                // Let's do a subtle attraction to cursor to feel "alive"
                if (enableMouseInteraction) {
                    const dx = mouseRef.current.x - bloom.x;
                    const dy = mouseRef.current.y - bloom.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Influence radius
                    if (dist < 600) {
                        // Subtle pull towards cursor
                        bloom.x += dx * 0.002;
                        bloom.y += dy * 0.002;
                    }
                }

                // Draw Gradient
                const gradient = ctx.createRadialGradient(
                    bloom.x,
                    bloom.y,
                    0,
                    bloom.x,
                    bloom.y,
                    bloom.radius
                );

                // Parse color to add stop
                gradient.addColorStop(0, bloom.color);
                gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(bloom.x, bloom.y, bloom.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        // Init
        window.addEventListener("resize", handleResize);
        window.addEventListener("mousemove", handleMouseMove);
        handleResize();
        initBlooms();
        animate();

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [bloomCount, enableMouseInteraction]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-0"
            aria-hidden="true"
        />
    );
}
