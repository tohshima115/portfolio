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
    /** ContourBackground の uChaos に流す MotionValue/数値 */
    chaos?: MotionValue<number> | number;
    /**
     * 0..1 の Hero→Statement dolly 進捗 (案 G)。
     * 親 outer motion.div に scale / filter / opacity を当てるので、ContourBackground
     * を含む全要素が物理的に同じ transform を受ける (= 行列順の手動同期が不要)。
     */
    dolly?: MotionValue<number>;
}

// Hero 専用のフルスクリーンセクション。
//
// 設計方針 (rev2): 「親 div で transform を一括管理」方式に統一。
//   旧方式は ContourBackground (R3F canvas) の auto-resize バグ回避のため、
//   各要素で個別に transform を当てて手動で行列順を同期する形だったが、
//   preserve-3d の合成順を完全一致させるのが困難でズレが残った。
//   現方式は ContourBackground の Canvas に resize={{ offsetSize: true }} を
//   設定して親 transform 影響下でも安定 sizing できるようにし、
//   intro 用 HeroLayer 内に ContourBackground を同居させて 1 階層で済ませる。

export const HeroSection: React.FC<Props> = ({ skipIntro, updates, active, chaos, dolly }) => {
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
            {/* HoverBackground は静的な radial gradient + noise だけで intro の影響を
                受ける必要がないので outer の直下 (HeroLayer の外) に置く。
                ただし outer の rotateX/rotateZ/scale/filter/opacity は受けるので、
                マウス連動と dolly の引きには一緒に追従する。 */}
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
                <HoverBackground hoveredItem={hoveredItem} />
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
                        chaos={chaos}
                    />
                </div>
            </motion.div>
        </div>
    );
};
