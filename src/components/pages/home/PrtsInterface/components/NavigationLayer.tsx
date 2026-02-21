import { motion } from 'framer-motion';
import { StatusBadges } from './StatusBadges';
import { SystemGuideLink } from './SystemGuideLink';
import { NavigationGrid } from './NavigationGrid';
import type { UpdateItem } from '../index';

interface NavigationLayerProps {
    updates?: UpdateItem[];
    onHoverItem?: (label: string | null) => void;
}

export const NavigationLayer = ({ updates, onHoverItem }: NavigationLayerProps) => {
    return (
        <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ transform: "translateZ(160px)" }}
        >
            <div className="relative w-[90vw] max-w-7xl h-[80vh] flex flex-col justify-between pointer-events-none">
                <StatusBadges updates={updates} />
                <SystemGuideLink />
                <NavigationGrid onHoverItem={onHoverItem} />
            </div>
        </motion.div>
    );
};
