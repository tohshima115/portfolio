import { motion, type MotionValue } from 'framer-motion';
import { FloorPlane } from '../../PrtsInterface/components/FloorPlane';
import { ShadowLayer } from '../../PrtsInterface/components/ShadowLayer';
import { MainTitle } from '../../PrtsInterface/components/MainTitle';
import { NavigationLayer } from '../../PrtsInterface/components/NavigationLayer';
import { Decorations } from '../../PrtsInterface/components/Decorations';
import { ContourBackground } from '../../PrtsInterface/components/ContourBackground';
import { MAIN_TITLE_TIMING_MS, msToS } from '../../PrtsInterface/config/animationTiming';
import type { UpdateItem } from '../types';

interface Props {
    skipIntro: boolean;
    contentX: MotionValue<number>;
    contentY: MotionValue<number>;
    onHoverItem: (label: string | null) => void;
    mouseX: MotionValue<number>;
    mouseY: MotionValue<number>;
    updates?: UpdateItem[];
    /** ContourBackground の uChaos に流す MotionValue/数値 */
    chaos?: MotionValue<number> | number;
}

export const HeroLayer = ({
    skipIntro,
    contentX,
    contentY,
    onHoverItem,
    mouseX,
    mouseY,
    updates,
    chaos,
}: Props) => {
    return (
        <motion.div
            // ===== DEBUG-CAMERA-OFF: intro 3D アニメーションを無効化 (切り分け用) =====
            // 戻すときはこのブロックを元に戻す:
            // initial={skipIntro ? false : { scale: 2.5, rotateY: -45, rotateX: 30 }}
            // animate={{ scale: 1, rotateY: 0, rotateX: 0 }}
            // transition={
            //     skipIntro
            //         ? { duration: 0 }
            //         : {
            //               delay: msToS(MAIN_TITLE_TIMING_MS.cameraZoomOutStart),
            //               duration: msToS(MAIN_TITLE_TIMING_MS.cameraZoomOutDuration),
            //               ease: [0.83, 0, 0.17, 1],
            //           }
            // }
            initial={false}
            animate={{ scale: 1, rotateY: 0, rotateX: 0 }}
            transition={{ duration: 0 }}
            // ===== /DEBUG-CAMERA-OFF =====
            style={{ transformStyle: 'preserve-3d' }}
            className="w-full h-full absolute inset-0 flex items-center justify-center origin-center"
        >
            {/* 等高線背景: 同じ親 (この intro motion.div) の子として置くことで、
                rotateY -30 / scale 1.8 → identity の intro と前景ロゴが物理的に
                同じ DOM 階層で合成され、行列順を手動同期する必要がなくなる。
                ContourBackground の Canvas は resize={{ offsetSize: true }} 設定で
                親 transform 影響下でも sizing が安定する。 */}
            <ContourBackground chaos={chaos} />
            <FloorPlane />
            <ShadowLayer contentX={contentX} contentY={contentY} />
            <MainTitle skipIntro={skipIntro} />
            <NavigationLayer
                updates={updates}
                onHoverItem={onHoverItem}
                skipIntro={skipIntro}
            />
            <Decorations mouseX={mouseX} mouseY={mouseY} />
        </motion.div>
    );
};
