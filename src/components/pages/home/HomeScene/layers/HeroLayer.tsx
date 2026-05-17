import { motion, type MotionValue } from 'framer-motion';
import { FloorPlane } from '../../PrtsInterface/components/FloorPlane';
import { ShadowLayer } from '../../PrtsInterface/components/ShadowLayer';
import { MainTitle } from '../../PrtsInterface/components/MainTitle';
import { NavigationLayer } from '../../PrtsInterface/components/NavigationLayer';
import { Decorations } from '../../PrtsInterface/components/Decorations';
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
}

export const HeroLayer = ({
    skipIntro,
    contentX,
    contentY,
    onHoverItem,
    mouseX,
    mouseY,
    updates,
}: Props) => {
    return (
        <motion.div
            initial={skipIntro ? false : { scale: 2.5, rotateY: -45, rotateX: 30 }}
            animate={{ scale: 1, rotateY: 0, rotateX: 0 }}
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
            {/* ContourBackground (等高線 R3F Canvas) は HomeIntro 直下に常時 mount する
                方式に変更したので、ここからは除外。loading overlay の裏で WebGL 初期化を
                先に済ませて、HeroSection mount 時の明滅を防ぐため。 */}
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
