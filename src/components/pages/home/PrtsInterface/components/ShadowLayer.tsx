import { motion, MotionValue } from 'framer-motion';

interface ShadowLayerProps {
    contentX: MotionValue<number>;
    contentY: MotionValue<number>;
}

export const ShadowLayer = ({ contentX, contentY }: ShadowLayerProps) => {
    return (
        <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-black/60 blur-[40px] rounded-full pointer-events-none"
            style={{
                transform: "translateZ(2px) rotateZ(-30deg)",
                x: contentX, y: contentY
            }}
        />
    );
};
