import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { ContourBackground } from '../PrtsInterface/components/ContourBackground';
import { HoverBackground } from '../PrtsInterface/components/HoverBackground';
import { HeroLayer } from '../HomeScene/layers/HeroLayer';
import type { UpdateItem } from '../HomeScene/types';
import { dollyOpacity } from './dollyCurves';

interface Props {
    skipIntro: boolean;
    updates?: UpdateItem[];
    active: boolean;
    /** 0..1 の遷移進捗。ContourBackground の uChaos uniform にバイパスする */
    chaos?: MotionValue<number> | number;
    /**
     * 0..1 の Hero→Statement dolly 進捗 (案 G)。HeroSection 側は opacity のみに反映。
     *   - scale は preserve-3d 配下の Z 距離を縮めて 3D 配置を崩すので避ける
     *   - filter:blur は新しい grouping context を作って preserve-3d をフラット化し、
     *     HeroLayer 内の translateZ (MainTitle 80 / NavigationLayer 160) が rotateX と
     *     組み合わさって「縦に引き伸ばされる」現象を引き起こすので避ける
     * scale + blur + opacity は ContourBackground (背景の等高線) に任せ、
     * 前景はクリアなまま opacity で薄れて消える表現にする (= 被写界深度的な分業)。
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
    // 重要: HeroSection の motion.div には scale も filter:blur も当てない。
    //   この motion.div は preserve-3d の起点で、子の HeroLayer 内では MainTitle や
    //   NavigationLayer が translateZ で 3D 配置されている:
    //     - scale をかけると Z 距離も比例して縮み、rotateX (鳥瞰角) と組み合わさって
    //       要素の Y 位置がズレる
    //     - filter:blur は新しい合成レイヤ (grouping context) を作って preserve-3d を
    //       フラット化する。translateZ がゼロ扱いになった上で rotateX で傾くので、
    //       要素全体が「縦に引き伸ばされた」ように見える
    //   どちらも「カメラ引き」感を出すために ContourBackground (背景) 側に任せ、
    //   前景 (ロゴ・ナビ) はクリアなまま opacity で薄れて消える形にする
    //   (= 被写界深度的な分業: subject はピントが残り、背景がボケる)
    const dollyFallback = useMotionValue(0);
    const dollySrc = dolly ?? dollyFallback;
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
                    opacity: heroOpacity,
                    transformStyle: 'preserve-3d',
                    willChange: 'transform, opacity',
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
