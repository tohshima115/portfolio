import { MotionValue } from 'framer-motion';
import React, { useEffect, useRef } from 'react';

interface DecorationsProps {
    mouseX: MotionValue<number>;
    mouseY: MotionValue<number>;
}

export const Decorations = ({ mouseX, mouseY }: DecorationsProps) => {
    const coordRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const updateCoords = () => {
            if (coordRef.current) {
                const x = Math.round(mouseX.get() * 100);
                const y = Math.round(mouseY.get() * 100);
                coordRef.current.innerText = `COORDINATES: ${x}, ${y}`;
            }
        };

        const unsubX = mouseX.on("change", updateCoords);
        const unsubY = mouseY.on("change", updateCoords);

        return () => {
            unsubX();
            unsubY();
        };
    }, [mouseX, mouseY]);

    return (
        <div
            className="absolute pointer-events-none"
            style={{ transform: "translateZ(50px)" }}
        >
            <div className="absolute -top-[300px] -right-[400px] text-right opacity-30 font-mono text-xs leading-relaxed text-yellow-400/80">
                <p>SYSTEM_READY</p>
                <p>INITIALIZING_RENDER_3.0</p>
                <p>LOADING_MODULES...</p>
                <p>ACCESS_GRANTED</p>
            </div>
            <div className="absolute -bottom-[300px] -left-[400px] text-left opacity-30 font-mono text-xs leading-relaxed text-white/50">
                <p ref={coordRef}>COORDINATES: 50, 50</p>
                <p>DEPTH_BUFFER: ENABLED</p>
            </div>
        </div>
    );
};
