import { useState } from 'react';
import { motion, type MotionValue } from 'framer-motion';
import { FloorPlane } from '../../PrtsInterface/components/FloorPlane';
import { MainTitle } from '../../PrtsInterface/components/MainTitle';
import { NavigationLayer } from '../../PrtsInterface/components/NavigationLayer';
import { Decorations } from '../../PrtsInterface/components/Decorations';
import { ContourBackground } from '../../PrtsInterface/components/ContourBackground';
import { MAIN_TITLE_TIMING_MS, msToS } from '../../PrtsInterface/config/animationTiming';

interface Props {
    skipIntro: boolean;
    contentX: MotionValue<number>;
    contentY: MotionValue<number>;
    onHoverItem: (label: string | null) => void;
    mouseX: MotionValue<number>;
    mouseY: MotionValue<number>;
    /** ContourBackground の uChaos に流す MotionValue/数値 */
    chaos?: MotionValue<number> | number;
}

// PC: scale 3.0 / rotateY -45 / rotateX 30 — 大きく寄ってダイナミックに引く演出。
// Mobile: scale のみ・回転なし。
//   rotateY/rotateX + translateZ(80px) + perspective 1000px の組み合わせが
//   小さい画面では perspective distortion でロゴを画面外に押し出す。
//   回転を 0 にすることで中央配置を保証する。
// useState の lazy initializer でマウント前に判定することで、Framer Motion が
// initial を読む初回レンダリングに確実に正しい値を渡す。
const DESKTOP_INITIAL  = { scale: 3.0, rotateY: -45, rotateX: 30 };
const MOBILE_INITIAL   = { scale: 2.4, rotateY: 0, rotateX: 0, y: -120 };
const DESKTOP_FINAL    = { scale: 1.15, rotateY: 0, rotateX: 0 };
const MOBILE_FINAL     = { scale: 1.4,  rotateY: 0, rotateX: 0 };

export const HeroLayer = ({
    skipIntro,
    contentX,
    contentY,
    onHoverItem,
    mouseX,
    mouseY,
    chaos,
}: Props) => {
    const [isMobile] = useState<boolean>(
        () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
    );

    const introInitial = isMobile ? MOBILE_INITIAL : DESKTOP_INITIAL;
    const introFinal   = isMobile ? MOBILE_FINAL   : DESKTOP_FINAL;

    return (
        <motion.div
            initial={skipIntro ? false : introInitial}
            animate={introFinal}
            transition={
                skipIntro
                    ? { duration: 0 }
                    : {
                          delay: msToS(MAIN_TITLE_TIMING_MS.cameraZoomOutStart),
                          duration: msToS(MAIN_TITLE_TIMING_MS.cameraZoomOutDuration),
                          ease: [0.83, 0, 0.17, 1],
                      }
            }
            style={{ transformStyle: 'preserve-3d' }}
            className="w-full h-full absolute inset-0 flex items-center justify-center origin-center"
        >
            {/* 等高線背景: 同じ親 (この intro motion.div) の子として置くことで、
                rotateY -45 / scale 2.5 → identity の intro 3D animation や、HeroSection の
                マウス連動 rotateX/Z、dolly の scale/opacity を等高線も一緒に受ける。 */}
            <ContourBackground chaos={chaos} />
            <FloorPlane />
            <MainTitle skipIntro={skipIntro} />
            <NavigationLayer
                onHoverItem={onHoverItem}
                skipIntro={skipIntro}
            />
            <Decorations mouseX={mouseX} mouseY={mouseY} />
        </motion.div>
    );
};
