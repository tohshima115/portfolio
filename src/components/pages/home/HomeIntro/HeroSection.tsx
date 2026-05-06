import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { ContourBackground } from '../PrtsInterface/components/ContourBackground';
import { HoverBackground } from '../PrtsInterface/components/HoverBackground';
import { HeroLayer } from '../HomeScene/layers/HeroLayer';
import type { UpdateItem } from '../HomeScene/types';
import { dollyScale, dollyOpacity } from './dollyCurves';

interface Props {
    skipIntro: boolean;
    updates?: UpdateItem[];
    active: boolean;
    /** 0..1 の遷移進捗。ContourBackground の uChaos uniform にバイパスする */
    chaos?: MotionValue<number> | number;
    /**
     * 0..1 の Hero→Statement dolly 進捗 (案 G)。
     * scale は preserve-3d の「外側」のレイヤに、opacity も外側に当てる。
     * (内側 motion.div で rotateX + preserve-3d を完結させ、外側で 2D 縮小すれば
     *  3D 空間内の Z 距離 = translateZ は影響を受けない。これで前景もカメラ引き
     *  しつつ MainTitle / NavigationLayer の 3D 配置は崩れない)
     * filter:blur は preserve-3d をフラット化するので前景には当てず、
     * 背景 (ContourBackground) 側にだけ scale + blur + opacity をかける。
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
    // 構造: 2 段の motion.div で preserve-3d を内側に閉じ込める
    //   外側 (transform-style: flat): scale + opacity
    //   内側 (transform-style: preserve-3d): rotateX + 子の translateZ 配置
    //
    // 内側の 3D 空間で rotateX + translateZ がレンダリングされ、その結果が
    // 投影として外側に渡る。外側の scale はその投影結果に対する 2D 縮小なので、
    // 内側 3D 空間内の Z 距離は変わらない (= MainTitle / NavigationLayer の
    // translateZ が影響を受けず、3D 配置の見え方が崩れない)。
    //
    // filter:blur は前景には当てない: filter は CSS 仕様で grouping context を作り、
    // preserve-3d をフラット化するため。前景 (ロゴ・ナビ) は scale + opacity だけ、
    // 背景 (等高線) は ContourBackground 側で scale + blur + opacity 全部当てる。
    const dollyFallback = useMotionValue(0);
    const dollySrc = dolly ?? dollyFallback;
    const heroScale = useTransform(dollySrc, dollyScale);
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
              外側ラッパ (transform-style: flat):
              dolly の scale + opacity をここに当てる。preserve-3d を持たないので
              内側 motion.div の 3D 空間は外側から見て「平面投影された結果」となり、
              その投影結果が scale で 2D 縮小される (= 3D 空間内の Z 距離は不変)。
            */}
            <motion.div
                style={{
                    scale: heroScale,
                    opacity: heroOpacity,
                    willChange: 'transform, opacity',
                }}
                className="relative w-full h-full origin-center"
            >
            {/*
              内側ラッパ (transform-style: preserve-3d):
              - rotateX = mouse Y 連動の鳥瞰角 (parallax)
              - HeroLayer 内の 3D 子要素 (NavigationLayer translateZ 160 / MainTitle 80)
                を camera の 3D 空間に載せる
            */}
            <motion.div
                style={{
                    rotateX,
                    transformStyle: 'preserve-3d',
                    willChange: 'transform',
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
            </motion.div>
        </div>
    );
};
