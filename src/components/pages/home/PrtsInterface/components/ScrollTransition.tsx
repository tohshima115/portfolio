import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';

const SCROLL_THRESHOLD = 1200;
const RESET_TIMEOUT = 1000;

export const ScrollTransition = () => {
    const [scrollAmount, setScrollAmount] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [flashKey, setFlashKey] = useState(0);
    const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTouchYRef = useRef<number | null>(null);

    // Handles the core accumulation logic
    const handleScrollDelta = (deltaY: number) => {
        if (isTransitioning) return;

        // Handling upward scroll (negative deltaY) for the flash effect
        if (deltaY < 0) {
            setFlashKey(prev => prev + 1);
            // Optionally clear scroll amount so downwards scroll has to start from 0 again if they were trying to go up
            setScrollAmount(0);
            return;
        }

        // Scrolling down (positive deltaY)
        setScrollAmount(prev => {
            let next = prev + deltaY;
            next = Math.max(0, Math.min(next, SCROLL_THRESHOLD));

            if (next >= SCROLL_THRESHOLD && !isTransitioning) {
                setIsTransitioning(true);
                setTimeout(() => {
                    window.location.href = '/works/portfolio-v4';
                }, 400); // Wait for transition visual
            }
            return next;
        });

        // Reset timer for settling back to 0
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => {
            setScrollAmount(0);
        }, RESET_TIMEOUT);
    };

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            // Detect vertical scroll
            handleScrollDelta(e.deltaY);
        };

        const handleTouchStart = (e: TouchEvent) => {
            lastTouchYRef.current = e.touches[0].clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (lastTouchYRef.current === null) return;
            const currentY = e.touches[0].clientY;
            const deltaY = lastTouchYRef.current - currentY; // positive = swipe down (scroll down)

            lastTouchYRef.current = currentY;
            // Touch screens often need a multiplier for a more responsive feel
            handleScrollDelta(deltaY * 2);
        };

        window.addEventListener('wheel', handleWheel, { passive: true });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        };
    }, [isTransitioning]);

    const isVisible = scrollAmount > 0; // Only show indicator when scrolling down

    const CIRCLE_RADIUS = 20;
    const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

    // Map smoothProgress (0 to 1) to strokeDashoffset
    const strokeDashoffset = useSpring(CIRCLE_CIRCUMFERENCE, {
        stiffness: 100,
        damping: 30,
        mass: 1,
    });

    useEffect(() => {
        // Update the smooth spring value based on scrollAmount
        const progress = Math.min(scrollAmount > 0 ? scrollAmount / SCROLL_THRESHOLD : 0, 1);
        strokeDashoffset.set(CIRCLE_CIRCUMFERENCE - (progress * CIRCLE_CIRCUMFERENCE));
    }, [scrollAmount, strokeDashoffset, CIRCLE_CIRCUMFERENCE]);

    return (
        <AnimatePresence>
            {/* Top overscroll input flash effect */}
            {flashKey > 0 && (
                <motion.div
                    key={`flash-${flashKey}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                        opacity: [0, 0.4, 0],
                        height: [0, 100, 0]
                    }}
                    transition={{
                        duration: 1.2,
                        times: [0, 0.05, 1],
                        ease: ["easeIn", "easeOut"]
                    }}
                    className="absolute top-0 left-0 w-full z-50 pointer-events-none"
                    style={{
                        background: `linear-gradient(to bottom, var(--color-logo) 0%, transparent 100%)`
                    }}
                />
            )}

            {isVisible && (
                <motion.div
                    key="scroll-indicator"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    transition={{ duration: 0.3 }}
                    className="absolute z-50 pointer-events-none flex flex-col items-center gap-4 left-1/2 -translate-x-1/2 bottom-24"
                >
                    <div className="relative flex items-center justify-center w-16 h-16">
                        <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 50 50">
                            <circle
                                cx="25"
                                cy="25"
                                r={CIRCLE_RADIUS}
                                fill="none"
                                stroke="var(--color-logo)"
                                strokeWidth="2"
                                opacity="0.2"
                            />
                            {/* Animated Progress Circle */}
                            <motion.circle
                                cx="25"
                                cy="25"
                                r={CIRCLE_RADIUS}
                                fill="none"
                                stroke={isTransitioning ? "var(--color-accent)" : "var(--color-logo)"}
                                strokeWidth="2"
                                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                                style={{
                                    strokeDashoffset: strokeDashoffset,
                                }}
                                strokeLinecap="round"
                            />
                        </svg>
                        {/* Center dot/icon */}
                        <motion.div
                            className={`w-1.5 h-1.5 rounded-full ${isTransitioning ? 'bg-accent' : 'bg-logo'}`}
                            animate={{ scale: isTransitioning ? [1, 1.5, 1] : 1 }}
                            transition={{ repeat: isTransitioning ? Infinity : 0, duration: 1 }}
                        />
                    </div>

                    <div className="font-mono text-[10px] tracking-widest uppercase flex items-center justify-center min-w-[280px]">
                        <AnimatePresence mode="popLayout">
                            {!isTransitioning ? (
                                <motion.span
                                    key="instruction"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-muted-foreground"
                                >
                                    SCROLL DOWN TO VIEW DETAILS
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="transition"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-accent font-bold"
                                >
                                    INITIATING SEQUENCE...
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
