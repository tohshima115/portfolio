import React, { useEffect, useRef, useState } from 'react';
import {
    motion,
    useMotionValue,
    useScroll,
    useSpring,
    useTransform,
} from 'framer-motion';
import { ContourBackground } from '../PrtsInterface/components/ContourBackground';
import { HoverBackground } from '../PrtsInterface/components/HoverBackground';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import { HeroLayer } from './layers/HeroLayer';
import { FeaturedProjectLayer } from './layers/FeaturedProjectLayer';
import { TechStackLayer } from './layers/TechStackLayer';
import { ContactCTALayer } from './layers/ContactCTALayer';
import type { UpdateItem } from './types';

export type { UpdateItem };

// Hero / Featured / Tech / CTA の 4 セクション。各 100vh ぶんスクロール領域を取る。
const SECTION_COUNT = 4;
const TOTAL_VH = SECTION_COUNT * 100;

const readSkipIntroFlag = (): boolean => {
    if (typeof window === 'undefined') return false;
    return Boolean(
        (window as unknown as { __prtsSkipIntro?: boolean }).__prtsSkipIntro,
    );
};

export const HomeScene = ({ updates = [] }: { updates?: UpdateItem[] }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [skipIntro] = useState<boolean>(readSkipIntroFlag);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
        const mb = window.matchMedia('(max-width: 640px)');
        const u1 = () => setReducedMotion(rm.matches);
        const u2 = () => setIsMobile(mb.matches);
        u1();
        u2();
        rm.addEventListener('change', u1);
        mb.addEventListener('change', u2);
        return () => {
            rm.removeEventListener('change', u1);
            mb.removeEventListener('change', u2);
        };
    }, []);

    // ----- Mouse parallax (PRTS の鳥瞰角) -----
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const springConfig = { damping: 20, stiffness: 100, mass: 1 };
    const rotateX = useSpring(useTransform(mouseY, [0, 1], [16, 24]), springConfig);
    const contentX = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), springConfig);
    const contentY = useSpring(useTransform(mouseY, [0, 1], [-5, 5]), springConfig);

    // mousemove の rect 計算は viewport (sticky 中身) を基準にする
    const rectRef = useRef<DOMRect | null>(null);
    useEffect(() => {
        const target = viewportRef.current;
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
        mouseX.set((e.clientX - rect.left) / rect.width);
        mouseY.set((e.clientY - rect.top) / rect.height);
    };
    const handleMouseLeave = () => {
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    // 同一オリジンリンクは WebGL トランジションへ
    const handleLinkClick = (e: React.MouseEvent) => {
        const target = (e.target as HTMLElement).closest('a');
        if (
            target &&
            target.href &&
            !target.href.startsWith('javascript') &&
            !target.href.includes('#')
        ) {
            try {
                const url = new URL(target.href);
                if (url.origin === window.location.origin) {
                    e.preventDefault();
                    playWebGLTransition({
                        url: target.pathname + target.search + target.hash,
                    });
                }
            } catch {
                /* ignore */
            }
        }
    };

    // ----- Scroll progress -----
    const { scrollYProgress } = useScroll({
        target: scrollRef,
        offset: ['start start', 'end end'],
    });

    // ContourBackground (R3F canvas) は親 DOM に CSS transform を当てると
    // framebuffer サイズが post-projection AABB で計測されて崩れる既知の制約があり、
    // カメラ div の子に置けない。そのため camera の motion value を ContourBackground に
    // 直接渡し、canvas DOM 自身の transform に組み込んで他のレイヤーと同じ位置に
    // anchor させる (= 構造上スクロールで他のレイヤーと一緒に流れる)。
    // カメラ Y は vh 文字列だと canvas の transform に渡せないので px に揃える。
    const vhRef = useRef<number>(typeof window !== 'undefined' ? window.innerHeight : 800);
    useEffect(() => {
        const u = () => {
            vhRef.current = window.innerHeight;
        };
        u();
        window.addEventListener('resize', u);
        return () => window.removeEventListener('resize', u);
    }, []);

    // 補正: モバイル / reduced motion のときは横方向 / 奥行きの振幅を抑える
    const ampXY = isMobile || reducedMotion ? 0 : 1;
    const ampZ = isMobile || reducedMotion ? 0 : 1;
    const ampRY = isMobile || reducedMotion ? 0 : 1;

    // piecewise linear interpolation helper
    const interp = (p: number, stops: number[]): number => {
        const breaks = [0, 0.33, 0.66, 1];
        if (p <= breaks[0]) return stops[0];
        for (let i = 0; i < breaks.length - 1; i++) {
            if (p <= breaks[i + 1]) {
                const t = (p - breaks[i]) / (breaks[i + 1] - breaks[i]);
                return stops[i] + (stops[i + 1] - stops[i]) * t;
            }
        }
        return stops[stops.length - 1];
    };

    // 各レイヤーは scene 空間で +X / +Y / +Z にずらして配置する。
    // カメラはその逆方向に動いて該当レイヤーを正面に持ってくる。
    const cameraX = useTransform(scrollYProgress, (p) =>
        interp(p, [0, -240 * ampXY, 260 * ampXY, 0]),
    );
    const cameraY = useTransform(scrollYProgress, (p) => {
        const vh = vhRef.current;
        return interp(p, [0, -1 * vh, -2 * vh, -3 * vh]);
    });
    const cameraZ = useTransform(scrollYProgress, (p) =>
        interp(p, [0, 180 * ampZ, -120 * ampZ, 0]),
    );
    const cameraRY = useTransform(scrollYProgress, (p) =>
        interp(p, [0, 6 * ampRY, -6 * ampRY, 0]),
    );

    return (
        <section
            ref={scrollRef}
            style={{ height: `${TOTAL_VH}vh` }}
            className="relative w-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClickCapture={handleLinkClick}
        >
            <div
                ref={viewportRef}
                className="sticky top-0 w-full h-screen bg-background overflow-hidden flex items-center justify-center shadow-inner"
                style={{ perspective: '1000px' }}
            >
                <ContourBackground
                    skipIntro={skipIntro}
                    rotateX={rotateX}
                    cameraX={cameraX}
                    cameraY={cameraY}
                    cameraZ={cameraZ}
                    cameraRY={cameraRY}
                />
                <HoverBackground hoveredItem={hoveredItem} />

                {/* 鳥瞰角 (mouse Y 連動) を当てる外側 3D ラッパ */}
                <motion.div
                    style={{ rotateX, rotateZ: 0, transformStyle: 'preserve-3d' }}
                    className="relative w-[150vw] h-[150vh] flex items-center justify-center origin-center"
                >
                    {/* "カメラ" = scroll 進捗に応じてシーン全体を逆方向へ動かす */}
                    <motion.div
                        style={{
                            x: cameraX,
                            y: cameraY,
                            z: cameraZ,
                            rotateY: cameraRY,
                            transformStyle: 'preserve-3d',
                        }}
                        className="absolute inset-0 origin-center"
                    >
                        {/* Hero (centered) */}
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ transform: 'translate3d(0, 0, 0)' }}
                        >
                            <HeroLayer
                                skipIntro={skipIntro}
                                contentX={contentX}
                                contentY={contentY}
                                onHoverItem={setHoveredItem}
                                mouseX={mouseX}
                                mouseY={mouseY}
                                updates={updates}
                            />
                        </div>

                        {/* Featured: 右奥 */}
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ transform: 'translate3d(240px, 100vh, -180px)' }}
                        >
                            <FeaturedProjectLayer progress={scrollYProgress} />
                        </div>

                        {/* Tech: 左手前 */}
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ transform: 'translate3d(-260px, 200vh, 120px)' }}
                        >
                            <TechStackLayer progress={scrollYProgress} />
                        </div>

                        {/* CTA: 中央奥 */}
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ transform: 'translate3d(0, 300vh, 0)' }}
                        >
                            <ContactCTALayer progress={scrollYProgress} />
                        </div>
                    </motion.div>
                </motion.div>

                {/* スクロール導線 (画面下中央のヒント) */}
                <ScrollHint progress={scrollYProgress} />
            </div>
        </section>
    );
};

const ScrollHint = ({ progress }: { progress: ReturnType<typeof useMotionValue<number>> | any }) => {
    const opacity = useTransform(progress, [0, 0.05, 0.12], [1, 1, 0]);
    return (
        <motion.div
            style={{ opacity }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-2"
        >
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                Scroll
            </span>
            <motion.span
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="block w-px h-6 bg-foreground/40"
            />
        </motion.div>
    );
};
