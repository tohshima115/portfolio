import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { ContourBackground } from '../PrtsInterface/components/ContourBackground';
import { HoverBackground } from '../PrtsInterface/components/HoverBackground';
import { HeroLayer } from '../HomeScene/layers/HeroLayer';
import type { UpdateItem } from '../HomeScene/types';
import { dollyBlurPx, dollyOpacity } from './dollyCurves';

interface Props {
    skipIntro: boolean;
    updates?: UpdateItem[];
    active: boolean;
    /** 0..1 の遷移進捗。ContourBackground の uChaos uniform にバイパスする */
    chaos?: MotionValue<number> | number;
    /**
     * 0..1 の Hero→Statement dolly 進捗 (案 G)。HeroSection 側は filter:blur と opacity
     * のみに反映 (scale は preserve-3d 配下の Z 距離を縮めて 3D 配置を崩すので避ける)。
     * ContourBackground にもそのまま流し、scale 由来の「カメラ引き」感は背景に任せる。
     */
    dolly?: MotionValue<number>;
}

// Hero 専用のフルスクリーンセクション。
// カメラを動かさない (新構造では各セクション独立) ため、ContourBackground の
// camera 系 motion value はすべて省略 (= 内部で 0 として扱われる)。
// rotateX (= 鳥瞰角の parallax) と HeroLayer の contentX/Y / mouseX/Y のみ生かす。
//
// active=false (Hero 非表示) の間は親が display:none で外しているので
// ContourBackground の IntersectionObserver が inView=false を観測し、
// frameloop="demand" の rAF ループ自体が止まる。

export const HeroSection: React.FC<Props> = ({ skipIntro, updates, active, chaos, dolly }) => {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const springConfig = { damping: 20, stiffness: 100, mass: 1 };
    const rotateX = useSpring(useTransform(mouseY, [0, 1], [16, 24]), springConfig);
    const contentX = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), springConfig);
    const contentY = useSpring(useTransform(mouseY, [0, 1], [-5, 5]), springConfig);

    // dolly: 親が undefined を渡してきても hooks を呼ぶ必要があるので fallback を常に作る。
    //
    // 重要: HeroSection の motion.div には scale を当てない。
    //   この motion.div は preserve-3d の起点で、子の HeroLayer 内では MainTitle や
    //   NavigationLayer が translateZ で 3D 配置されている。scale をかけると Z 距離も
    //   比例して縮み、rotateX (鳥瞰角) と組み合わさって Y 位置がズレる
    //   (= ロゴが縦に伸びる / PROJECT ナビが下にずれる現象の原因)。
    //   scale 由来の「カメラ引き」感は ContourBackground (背景の等高線) に任せ、
    //   HeroLayer 側は blur と opacity だけで「ピントが外れて遠のく」表現にする。
    const dollyFallback = useMotionValue(0);
    const dollySrc = dolly ?? dollyFallback;
    const heroFilter = useTransform(dollySrc, (p: number) => {
        const px = dollyBlurPx(p);
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
        if (!active) return; // 非表示中は parallax 反応させない
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
            <ContourBackground skipIntro={skipIntro} rotateX={rotateX} chaos={chaos} dolly={dolly} />
            <HoverBackground hoveredItem={hoveredItem} />

            {/*
              外側ラッパ:
              - rotateX = mouse Y 連動の鳥瞰角 (parallax)
              旧構造の camera 連動 rotateZ は撤去 (各セクション独立で天地固定)。
              HeroLayer 内の 3D 子要素 (NavigationLayer translateZ 160 / MainTitle 80)
              を camera の 3D 空間に正しく載せるため preserve-3d を維持する。
            */}
            <motion.div
                style={{
                    rotateX,
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
