import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export const PrtsInterface = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Mouse position
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    // Spring config for smooth movement
    const springConfig = { damping: 20, stiffness: 100, mass: 1 };

    // Rotation Logic:
    // rotateX: 60 degrees base tilt (looking down), +/- 10 degrees based on mouse Y
    // rotateZ: 30 degrees base rotation, +/- 10 degrees based on mouse X (adds dynamic diagonal feel)
    const rotateX = useSpring(useTransform(mouseY, [0, 1], [20, 40]), springConfig);
    const rotateZ = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), springConfig);

    // Parallax movements for floating elements
    // As mouse moves, elements shift slightly to enhance depth
    const contentX = useSpring(useTransform(mouseX, [0, 1], [-20, 20]), springConfig);
    const contentY = useSpring(useTransform(mouseY, [0, 1], [-20, 20]), springConfig);

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
            className="w-full h-screen bg-neutral-950 overflow-hidden flex items-center justify-center relative"
            style={{ perspective: "1000px" }} // Stronger perspective for depth
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background Gradient (Fixed) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1f1f1f_0%,_#0a0a0a_100%)] pointer-events-none z-0" />

            {/* 3D Scene Container - Tilted World */}
            <motion.div
                style={{
                    rotateX,
                    rotateZ,
                    transformStyle: "preserve-3d",
                }}
                className="relative w-[150vw] h-[150vh] flex items-center justify-center origin-center"
            >
                {/* === FLOOR PLANE (Base Z=0) === */}
                <div
                    className="absolute inset-0"
                    style={{ transform: "translateZ(0px)" }}
                >
                    {/* Infinite Grid */}
                    <div
                        className="absolute inset-0 opacity-[0.2]"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), 
                                linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
                            `,
                            backgroundSize: '80px 80px',
                            maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)'
                        }}
                    />

                    {/* Large Circle Decoration on Floor */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full border-dashed" />
                </div>


                {/* === SHADOW LAYER (Projected Shadows on Floor) === */}
                {/* These are blurred dark shapes placed at Z=0 to represent shadows of floating objects */}

                {/* Title Shadow */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-black/60 blur-[40px] rounded-full pointer-events-none"
                    style={{
                        transform: "translateZ(2px) rotateZ(-30deg)", // Counter-rotate shadow slightly if needed, or just blur it
                        x: contentX, y: contentY // Move shadow slightly for parallax
                    }}
                />


                {/* === FLOATING CONTENT LAYER (Z=100px) === */}
                <motion.div
                    className="absolute flex flex-col items-center justify-center text-center preserve-3d"
                    style={{
                        transform: "translateZ(100px)",
                        // Counter-rotate logic could be added here if we wanted elements to face camera, 
                        // but "bird's eye view" implies looking down at them lying flat.
                        // We keep them flat (parallel to floor) but floating.
                    }}
                >
                    {/* Main Title Group */}
                    <div className="relative isolate">
                        {/* Decorative geometric shape behind title */}
                        <div className="absolute -inset-10 bg-gradient-to-tr from-yellow-400/10 to-transparent blur-2xl rounded-full opacity-30 pointer-events-none" />

                        <h1
                            className="text-[8vw] md:text-[6rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 leading-[0.85] select-none"
                            style={{
                                textShadow: '0 0 1px rgba(255,255,255,0.5)' // Crisp edges
                            }}
                        >
                            SHOGO<br />TOYOSHIMA
                        </h1>

                        <div className="mt-6 flex items-center justify-center gap-4">
                            <div className="h-[2px] w-12 bg-yellow-400"></div>
                            <p className="font-mono text-xs md:text-sm tracking-[0.3em] text-yellow-500 font-bold uppercase">
                                Design Engineer
                            </p>
                            <div className="h-[2px] w-12 bg-yellow-400"></div>
                        </div>
                    </div>

                    {/* Interactive Elements Group - Floating even higher (Z=150) relative to this layer? 
                        No, let's just margin them out. 
                        Actually, let's give them their own Z for more depth.
                    */}
                </motion.div>


                {/* === HIGHER FLOATING UI LAYER (Z=180px) === */}
                <motion.div
                    className="absolute flex gap-8 pointer-events-auto"
                    style={{
                        transform: "translateZ(180px)",
                        marginTop: "300px" // Offset from center roughly
                    }}
                >
                    <a href="/works" className="group">
                        {/* Button Shadow (Local) */}
                        <div className="absolute top-10 left-0 w-full h-full bg-black/50 blur-xl transition-all duration-300 group-hover:blur-2xl group-hover:scale-110" />

                        <div className="relative px-10 py-4 bg-neutral-900 border border-white/20 hover:border-yellow-400 text-white hover:text-yellow-400 transition-all duration-300 rounded-[2px] font-mono text-sm tracking-widest uppercase flex items-center gap-3 group-hover:-translate-y-2">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            View Works
                        </div>
                    </a>

                    <a href="/about" className="group">
                        <div className="absolute top-10 left-0 w-full h-full bg-black/50 blur-xl transition-all duration-300 group-hover:blur-2xl group-hover:scale-110" />

                        <div className="relative px-10 py-4 bg-neutral-900 border border-white/20 hover:border-white text-neutral-400 hover:text-white transition-all duration-300 rounded-[2px] font-mono text-sm tracking-widest uppercase flex items-center gap-3 group-hover:-translate-y-2">
                            About Me
                        </div>
                    </a>
                </motion.div>

                {/* === FLOATING DECORATIONS (Z=50px) === */}
                <div
                    className="absolute pointer-events-none"
                    style={{ transform: "translateZ(50px)" }}
                >
                    {/* Floating Code Snippet or Abstract Tech Text */}
                    <div className="absolute -top-[300px] -right-[400px] text-right opacity-30 font-mono text-xs leading-relaxed text-yellow-400/80">
                        <p>SYSTEM_READY</p>
                        <p>INITIALIZING_RENDER_2.0</p>
                        <p>LOADING_MODULES...</p>
                        <p>ACCESS_GRANTED</p>
                    </div>

                    <div className="absolute -bottom-[300px] -left-[400px] text-left opacity-30 font-mono text-xs leading-relaxed text-white/50">
                        <p>COORDINATES: {Math.round(mouseX.get() * 100)}, {Math.round(mouseY.get() * 100)}</p>
                        <p>DEPTH_BUFFER: ENABLED</p>
                    </div>
                </div>

            </motion.div>
        </div>
    );
};
