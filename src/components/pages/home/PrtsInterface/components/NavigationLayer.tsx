import { motion } from 'framer-motion';
import { StatusBadges } from './StatusBadges';
import { SystemGuideLink } from './SystemGuideLink';
import { NavigationGrid } from './NavigationGrid';

interface NavigationLayerProps {
    onHoverItem?: (label: string | null) => void;
    skipIntro?: boolean;
}

export const NavigationLayer = ({ onHoverItem, skipIntro = false }: NavigationLayerProps) => {
    return (
        <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ transform: "translateZ(160px)" }}
        >
            <div className="relative w-[90vw] max-w-7xl h-[80vh] flex flex-col justify-between pointer-events-none">
                <StatusBadges />
                <SystemGuideLink />
                <NavigationGrid onHoverItem={onHoverItem} skipIntro={skipIntro} />
            </div>
        </motion.div>
    );
};
