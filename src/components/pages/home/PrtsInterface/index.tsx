import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { navigate } from 'astro:transitions/client';
import { FloorPlane } from './components/FloorPlane';
import { ShadowLayer } from './components/ShadowLayer';
import { MainTitle } from './components/MainTitle';
import { NavigationLayer } from './components/NavigationLayer';
import { Decorations } from './components/Decorations';
import { HoverBackground } from './components/HoverBackground';
import { ScrollTransition } from './components/ScrollTransition';
import { MAIN_TITLE_TIMING_MS, msToS } from './config/animationTiming';

export interface UpdateItem {
    title: string;
    date: string; // ISO string to accommodate SSR serialization
    url: string;
    type: 'works' | 'blog';
}

export const PrtsInterface = ({ updates = [] }: { updates?: UpdateItem[] }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [isExiting, setIsExiting] = useState(false);

    // Mouse position
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    // Spring config for smooth movement
    const springConfig = { damping: 20, stiffness: 100, mass: 1 };

    // Rotation Logic (Weakened):
    const rotateX = useSpring(useTransform(mouseY, [0, 1], [16, 24]), springConfig);

    // Parallax movements (Weakened):
    const contentX = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), springConfig);
    const contentY = useSpring(useTransform(mouseY, [0, 1], [-5, 5]), springConfig);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const { width, height, left, top } = containerRef.current.getBoundingClientRect();

        const x = (e.clientX - left) / width;
        const y = (e.clientY - top) / height;

        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    const handleLinkClick = (e: React.MouseEvent) => {
        const target = (e.target as HTMLElement).closest('a');
        if (target && target.href && !target.href.startsWith('javascript') && !target.href.includes('#')) {
            try {
                const url = new URL(target.href);
                // Intercept same-origin navigation
                if (url.origin === window.location.origin) {
                    e.preventDefault();
                    setIsExiting(true);

                    // Trigger actual navigation *during* the zoom out acceleration
                    setTimeout(() => {
                        navigate(target.pathname + target.search + target.hash);
                    }, 50);
                }
            } catch (err) {
                // Ignore invalid URLs
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-screen bg-background overflow-hidden flex items-center justify-center relative shadow-inner"
            style={{ perspective: "1000px" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClickCapture={handleLinkClick}
        >
            <HoverBackground hoveredItem={hoveredItem} />
            <ScrollTransition />

            {/* 3D Scene Container - Mouse tracking base */}
            <motion.div
                style={{
                    rotateX,
                    rotateZ: 0,
                    transformStyle: "preserve-3d",
                }}
                className="relative w-[150vw] h-[150vh] flex items-center justify-center origin-center"
            >
                {/* Intro Animation Container */}
                <motion.div
                    initial={{ scale: 1.8, rotateY: -30, rotateX: 20 }}
                    animate={
                        isExiting
                            ? { scale: 0.4, rotateY: 0, rotateX: 0 }
                            : { scale: 1, rotateY: 0, rotateX: 0 }
                    }
                    transition={
                        isExiting
                            ? {
                                duration: 0.8, // Match view transition duration
                                ease: [0.83, 0, 0.17, 1] // Match ease-in-out-quint
                            }
                            : {
                                delay: msToS(MAIN_TITLE_TIMING_MS.cameraZoomOutStart),
                                duration: msToS(MAIN_TITLE_TIMING_MS.cameraZoomOutDuration),
                                ease: [0.83, 0, 0.17, 1] // var(--ease-in-out-quint)
                            }
                    }
                    style={{
                        transformStyle: "preserve-3d",
                        pointerEvents: isExiting ? "none" : "auto",
                    }}
                    className="w-full h-full absolute inset-0 flex items-center justify-center origin-center"
                >
                    <FloorPlane />
                    <ShadowLayer contentX={contentX} contentY={contentY} />
                    <MainTitle />
                    <NavigationLayer updates={updates} onHoverItem={setHoveredItem} />
                    <Decorations mouseX={mouseX} mouseY={mouseY} />
                </motion.div>
            </motion.div>
        </div>
    );
};
