import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { HoverBackground } from '../PrtsInterface/components/HoverBackground';
import { HeroLayer } from '../HomeScene/layers/HeroLayer';
import { dollyScale, dollyBlurPxFg, dollyOpacity } from './dollyCurves';

interface Props {
    skipIntro: boolean;
    active: boolean;
    /** ContourBackground の uChaos に流す MotionValue/数値 */
    chaos?: MotionValue<number> | number;
    /**
     * 0..1 の Hero→Statement dolly 進捗。
     * outer motion.div に scale / filter / opacity を当てる。HeroLayer 内の
     * ContourBackground もこの transform を一緒に受ける。
     */
    dolly?: MotionValue<number>;
}

// Hero 専用のフルスクリーンセクション。
// 構造を 2 段に分割:
//   outer dolly motion.div : scale / filter / opacity (2D only, preserve-3d なし)
//   inner 3D motion.div    : rotateX / rotateZ + preserve-3d
// filter / opacity / will-change は stacking context を作って preserve-3d を
// フラット化するため、それらと 3D rotate を同じレイヤに同居させると子の
// translateZ (MainTitle 80px / NavigationLayer 160px) による高さが潰れる。
// 2 段に分けることで dolly の引き&ブラーを保ちつつ Z 軸の浮き上がりを残す。

export const HeroSection: React.FC<Props> = ({ skipIntro, active, chaos, dolly }) => {
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

    // モバイル: タッチドラッグで傾きを操作（マウスと同じ rotateX/Z に流す）
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!active) return;
        const rect = rectRef.current;
        if (!rect) return;
        const touch = e.touches[0];
        mouseX.set((touch.clientX - rect.left) / rect.width);
        mouseY.set((touch.clientY - rect.top) / rect.height);
    };
    const handleTouchEnd = () => {
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
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* 静的背景レイヤー (radial gradient + noise): カメラ追従の枠外。
                outer motion.div の外側に置くことで rotateX/rotateZ/scale/filter/opacity
                の影響を受けず、画面いっぱいに固定で広がる。 */}
            <HoverBackground hoveredItem={hoveredItem} />

            {/* 外側: dolly (scale/filter/opacity) 専用。preserve-3d は持たず 2D 合成のみ。 */}
            <motion.div
                style={{
                    scale: heroScale,
                    filter: heroFilter,
                    opacity: heroOpacity,
                    willChange: 'filter, opacity, transform',
                }}
                className="relative w-full h-full flex items-center justify-center origin-center"
            >
                {/* 内側: マウス連動の 3D rotate と preserve-3d。
                    ここから下に filter/opacity を一切置かないことで子の translateZ を生かす。 */}
                <motion.div
                    style={{
                        rotateX,
                        rotateZ,
                        transformStyle: 'preserve-3d',
                        willChange: 'transform',
                    }}
                    className="absolute inset-0 flex items-center justify-center origin-center"
                >
                    <HeroLayer
                        skipIntro={skipIntro}
                        contentX={contentX}
                        contentY={contentY}
                        onHoverItem={setHoveredItem}
                        mouseX={mouseX}
                        mouseY={mouseY}
                        chaos={chaos}
                    />
                </motion.div>
            </motion.div>
        </div>
    );
};
