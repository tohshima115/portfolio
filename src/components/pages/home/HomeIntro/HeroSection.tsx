import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { HoverBackground } from '../PrtsInterface/components/HoverBackground';
import { HeroLayer } from '../HomeScene/layers/HeroLayer';
import type { UpdateItem } from '../HomeScene/types';
import { dollyScale, dollyBlurPxFg, dollyOpacity } from './dollyCurves';

interface Props {
    skipIntro: boolean;
    updates?: UpdateItem[];
    active: boolean;
    /**
     * 0..1 の Hero→Statement dolly 進捗。
     * outer motion.div に scale / filter / opacity を当てる (ロゴ・nav 等の前景のみ)。
     * 等高線は HomeIntro 直下に常時 mount しているのでここからは影響を受けない。
     */
    dolly?: MotionValue<number>;
}

// Hero 専用のフルスクリーンセクション。前景 (HoverBackground + HeroLayer = ロゴ・nav 等) を
// マウス連動 / dolly transform で動かす。ContourBackground (等高線) は HomeIntro 直下で
// 常時 mount するので、HeroSection の transform は受けない (= loading 中に裏で WebGL
// 初期化を完了させて明滅を防ぐため)。

export const HeroSection: React.FC<Props> = ({ skipIntro, updates, active, dolly }) => {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const springConfig = { damping: 20, stiffness: 100, mass: 1 };
    const rotateX = useSpring(useTransform(mouseY, [0, 1], [20, 40]), springConfig);
    const rotateZ = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), springConfig);
    const contentX = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), springConfig);
    const contentY = useSpring(useTransform(mouseY, [0, 1], [-5, 5]), springConfig);

    // dolly: 親が undefined を渡してきても hooks を呼ぶ必要があるので fallback を常に作る。
    const dollyFallback = useMotionValue(0);
    const dollySrc = dolly ?? dollyFallback;
    const heroScale = useTransform(dollySrc, dollyScale);
    const heroFilter = useTransform(dollySrc, (p: number) => {
        const px = dollyBlurPxFg(p);
        // blur(0px) でもレイヤを作るブラウザ対策。閾値前は filter を 'none' に。
        return px > 0.05 ? `blur(${px.toFixed(2)}px)` : 'none';
    });
    const heroOpacity = useTransform(dollySrc, dollyOpacity);

    const viewportRef = useRef<HTMLDivElement>(null);
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
        if (!active) return;
        const rect = rectRef.current;
        if (!rect) return;
        mouseX.set((e.clientX - rect.left) / rect.width);
        mouseY.set((e.clientY - rect.top) / rect.height);
    };
    const handleMouseLeave = () => {
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    return (
        <div
            ref={viewportRef}
            className="absolute inset-0 w-full h-full bg-background overflow-hidden flex items-center justify-center shadow-inner"
            style={{ perspective: '1000px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* 静的背景レイヤー (radial gradient + noise): カメラ追従の枠外。
                outer motion.div の外側に置くことで rotateX/rotateZ/scale/filter/opacity
                の影響を受けず、画面いっぱいに固定で広がる。 */}
            <HoverBackground hoveredItem={hoveredItem} />

            <motion.div
                style={{
                    rotateX,
                    rotateZ,
                    scale: heroScale,
                    filter: heroFilter,
                    opacity: heroOpacity,
                    transformStyle: 'preserve-3d',
                    willChange: 'transform, filter, opacity',
                }}
                className="relative w-full h-full flex items-center justify-center origin-center"
            >
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                        transform: 'translate3d(0, 0, 0)',
                        transformStyle: 'preserve-3d',
                    }}
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
            </motion.div>
        </div>
    );
};
