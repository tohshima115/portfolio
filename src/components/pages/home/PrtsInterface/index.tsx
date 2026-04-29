import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import { FloorPlane } from './components/FloorPlane';
import { ShadowLayer } from './components/ShadowLayer';
import { MainTitle } from './components/MainTitle';
import { NavigationLayer } from './components/NavigationLayer';
import { Decorations } from './components/Decorations';
import { HoverBackground } from './components/HoverBackground';
import { ScrollTransition } from './components/ScrollTransition';
import { ContourBackground } from './components/ContourBackground';
import { MAIN_TITLE_TIMING_MS, msToS } from './config/animationTiming';

export interface UpdateItem {
    title: string;
    date: string; // ISO string to accommodate SSR serialization
    url: string;
    type: 'projects' | 'blog';
}

// 初回訪問判定: sessionStorage の読み書きは index.astro 内のインラインスクリプトで
// React マウント前に同期実行され、結果が window.__prtsSkipIntro に格納される。
// useState の lazy initializer で同期的に読み取ることで、framer-motion の最初の
// render から initial={false} / transition.duration=0 を適用できる。
const readSkipIntroFlag = (): boolean => {
    if (typeof window === 'undefined') return false;
    return Boolean((window as unknown as { __prtsSkipIntro?: boolean }).__prtsSkipIntro);
};

export const PrtsInterface = ({ updates = [] }: { updates?: UpdateItem[] }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [skipIntro] = useState<boolean>(readSkipIntroFlag);

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

    // mousemove は 60-120Hz で発火するため、毎回 getBoundingClientRect() すると
    // レイアウト読み出しでメインスレッドが詰まる。ResizeObserver + scroll/resize
    // でキャッシュし、ハンドラ側ではキャッシュを参照するだけにする。
    const rectRef = useRef<DOMRect | null>(null);
    useEffect(() => {
        const target = containerRef.current;
        if (!target) return;
        const update = () => {
            rectRef.current = target.getBoundingClientRect();
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(target);
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            ro.disconnect();
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = rectRef.current;
        if (!rect) return;
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
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
                    // WebGL トランジション → cover フェーズ内部で navigate() を呼ぶ
                    playWebGLTransition({
                        url: target.pathname + target.search + target.hash,
                    });
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
            {/*
              等高線背景: 3D シーンと同じ rotateX を共有してマウス追従カメラの適用範囲に入れる。
              HoverBackground は mix-blend-overlay で contour 上に重ねるため、ここは
              HoverBackground より下 (= 先に描画) に置く。
              wrapper は 150vw × 150vh まで広げて、回転で edge にギャップが出ないようにする。
            */}
            <motion.div
                aria-hidden="true"
                style={{ rotateX }}
                className="absolute top-[-25vh] left-[-25vw] w-[150vw] h-[150vh] origin-center pointer-events-none"
            >
                <ContourBackground skipIntro={skipIntro} />
            </motion.div>
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
                    initial={skipIntro ? false : { scale: 1.8, rotateY: -30, rotateX: 20 }}
                    animate={{ scale: 1, rotateY: 0, rotateX: 0 }}
                    transition={
                        skipIntro
                            ? { duration: 0 }
                            : {
                                  delay: msToS(MAIN_TITLE_TIMING_MS.cameraZoomOutStart),
                                  duration: msToS(MAIN_TITLE_TIMING_MS.cameraZoomOutDuration),
                                  ease: [0.83, 0, 0.17, 1] // var(--ease-in-out-quint)
                              }
                    }
                    style={{
                        transformStyle: "preserve-3d",
                    }}
                    className="w-full h-full absolute inset-0 flex items-center justify-center origin-center"
                >
                    <FloorPlane />
                    <ShadowLayer contentX={contentX} contentY={contentY} />
                    <MainTitle skipIntro={skipIntro} />
                    <NavigationLayer updates={updates} onHoverItem={setHoveredItem} skipIntro={skipIntro} />
                    <Decorations mouseX={mouseX} mouseY={mouseY} />
                </motion.div>
            </motion.div>
        </div>
    );
};
