import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FloorPlane } from './components/FloorPlane';
import { ShadowLayer } from './components/ShadowLayer';
import { MainTitle } from './components/MainTitle';
import { NavigationLayer } from './components/NavigationLayer';
import { Decorations } from './components/Decorations';
import { HoverBackground } from './components/HoverBackground';

export interface UpdateItem {
    title: string;
    date: string; // ISO string to accommodate SSR serialization
    url: string;
    type: 'works' | 'blog';
}

export const PrtsInterface = ({ updates = [] }: { updates?: UpdateItem[] }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    // Mouse position
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    // Spring config for smooth movement
    const springConfig = { damping: 20, stiffness: 100, mass: 1 };

    // Rotation Logic (Weakened):
    const rotateX = useSpring(useTransform(mouseY, [0, 1], [18, 22]), springConfig);
    const rotateZ = useSpring(useTransform(mouseX, [0, 1], [-2, 2]), springConfig);

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

    return (
        <div
            ref={containerRef}
            className="w-full h-screen bg-background overflow-hidden flex items-center justify-center relative"
            style={{ perspective: "1000px" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <HoverBackground hoveredItem={hoveredItem} />

            {/* 3D Scene Container */}
            <motion.div
                style={{
                    rotateX,
                    rotateZ,
                    transformStyle: "preserve-3d",
                }}
                className="relative w-[150vw] h-[150vh] flex items-center justify-center origin-center"
            >
                <FloorPlane />
                <ShadowLayer contentX={contentX} contentY={contentY} />
                <MainTitle />
                <NavigationLayer updates={updates} onHoverItem={setHoveredItem} />
                <Decorations mouseX={mouseX} mouseY={mouseY} />
            </motion.div>
        </div>
    );
};
