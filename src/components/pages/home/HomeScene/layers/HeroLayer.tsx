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

export const HeroLayer = ({
    skipIntro,
    contentX,
    contentY,
    onHoverItem,
    mouseX,
    mouseY,
    chaos,
}: Props) => {
    return (
        <motion.div
            initial={skipIntro ? false : { scale: 3.0, rotateY: -45, rotateX: 30 }}
            animate={{ scale: 1.15, rotateY: 0, rotateX: 0 }}
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
