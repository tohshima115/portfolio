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
    const rotateX = useSpring(useTransform(mouseY, [0, 1], [20, 40]), springConfig);
    const rotateZ = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), springConfig);

    // Parallax movements
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
            style={{ perspective: "1000px" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1f1f1f_0%,_#0a0a0a_100%)] pointer-events-none z-0" />

            {/* 3D Scene Container */}
            <motion.div
                style={{
                    rotateX,
                    rotateZ,
                    transformStyle: "preserve-3d",
                }}
                className="relative w-[150vw] h-[150vh] flex items-center justify-center origin-center"
            >
                {/* === FLOOR PLANE (Base Z=0) === */}
                <div className="absolute inset-0" style={{ transform: "translateZ(0px)" }}>
                    {/* Infinite Grid */}
                    <div
                        className="absolute inset-0 opacity-[0.2]"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
                            backgroundSize: '80px 80px',
                            maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)'
                        }}
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full border-dashed" />
                </div>

                {/* === SHADOW LAYER === */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-black/60 blur-[40px] rounded-full pointer-events-none"
                    style={{
                        transform: "translateZ(2px) rotateZ(-30deg)",
                        x: contentX, y: contentY
                    }}
                />

                {/* === MAIN TITLE (Z=80px) === */}
                <motion.div
                    className="absolute flex flex-col items-center justify-center text-center preserve-3d pointer-events-none"
                    style={{
                        transform: "translateZ(80px)",
                        marginTop: "-150px" // Shift up to separate from nav
                    }}
                >
                    <div className="relative isolate">
                        <div className="absolute -inset-10 bg-gradient-to-tr from-yellow-400/10 to-transparent blur-2xl rounded-full opacity-30" />

                        <h1
                            className="text-[8vw] md:text-[6rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 leading-[0.85] select-none"
                            style={{ textShadow: '0 0 1px rgba(255,255,255,0.5)' }}
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
                </motion.div>

                {/* === INTERACTIVE UI LAYER (Z=160px) === */}
                <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto"
                    style={{ transform: "translateZ(160px)" }}
                >
                    {/* HUD Elements Container - Using absolute positioning relative to content center roughly */}
                    <div className="relative w-[90vw] max-w-7xl h-[80vh] flex flex-col justify-between">

                        {/* Top Right: Status & Feed */}
                        <div className="self-end flex flex-col sm:flex-row gap-4 items-end sm:items-center mt-20 mr-10 opacity-80 hover:opacity-100 transition-opacity">
                            <a href="/rss.xml" className="group px-4 py-2 bg-black/40 border border-white/10 rounded-full backdrop-blur-md shadow-lg hover:border-yellow-400 transition-colors flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full group-hover:animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                                <span className="font-mono text-[10px] text-neutral-400 group-hover:text-yellow-400 tracking-widest">SIGNAL_FEED</span>
                            </a>
                            <div className="px-4 py-2 bg-black/40 border border-white/10 rounded-full backdrop-blur-md shadow-lg flex items-center gap-3">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                </span>
                                <span className="font-mono text-[10px] text-neutral-400 tracking-widest">SYSTEM ONLINE</span>
                            </div>
                        </div>

                        {/* Bottom Left: System Guide */}
                        <div className="absolute bottom-20 left-10 hidden lg:block">
                            <a href="/system" className="font-mono text-[10px] text-neutral-500 hover:text-yellow-400 tracking-[0.2em] transition-colors border-b border-transparent hover:border-yellow-400 pb-1 flex items-center gap-2 group">
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">{">>"}</span>
                                SYSTEM_GUIDE
                            </a>
                        </div>

                        {/* Bottom Center: Main Navigation */}
                        <div className="mt-auto mb-20 self-center w-full max-w-4xl px-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                {[
                                    { label: "ARCHIVES", href: "/works", sub: "Projects" },
                                    { label: "LOGS", href: "/blog", sub: "Dev & Thoughts" },
                                    { label: "PROFILE", href: "/about", sub: "Who I Am" },
                                    { label: "COMM", href: "/contact", sub: "Contact" },
                                ].map((item) => (
                                    <a key={item.label} href={item.href} className="group relative w-full aspect-[2/1] perspective-500">
                                        {/* Shadow on floor from button */}
                                        <div className="absolute top-20 left-4 right-4 h-4 bg-black/60 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                        {/* Button Body */}
                                        <div className="absolute inset-0 bg-neutral-900/90 border border-white/10 group-hover:border-yellow-400/60 transition-all duration-300 flex flex-col items-center justify-center gap-1 shadow-2xl group-hover:shadow-[0_0_30px_rgba(250,204,21,0.15)] group-hover:-translate-y-2 group-hover:scale-105 backdrop-blur-sm overflow-hidden">
                                            {/* Scanline background */}
                                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)", backgroundSize: "100% 4px" }} />

                                            <span className="font-mono text-sm md:text-base tracking-widest text-neutral-300 group-hover:text-yellow-400 transition-colors z-10 font-bold">{item.label}</span>
                                            <span className="text-[10px] text-neutral-500 uppercase tracking-wide group-hover:text-neutral-400 transition-colors z-10">{item.sub}</span>
                                        </div>

                                        {/* Corner Accents */}
                                        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/20 group-hover:border-yellow-400 transition-colors duration-300" />
                                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/20 group-hover:border-yellow-400 transition-colors duration-300" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* === FLOATING DECORATIONS (Z=50px) === */}
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
                </div>

            </motion.div>
        </div>
    );
};
