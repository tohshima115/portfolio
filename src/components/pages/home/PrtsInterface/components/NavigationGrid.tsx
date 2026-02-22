import React from 'react';
import { motion } from 'framer-motion';
import { NavButton } from './NavButton';
import { MAIN_TITLE_TIMING_MS, msToS } from '../config/animationTiming';

interface NavigationGridProps {
    onHoverItem?: (label: string | null) => void;
}

export const NavigationGrid = ({ onHoverItem }: NavigationGridProps) => {
    const navItems = [
        { label: "PROJECTS", href: "/works" },
        { label: "BLOG", href: "/blog" },
        { label: "ABOUT", href: "/about" },
        { label: "CONTACT", href: "/contact" },
    ];

    return (
        <div className="mt-auto mb-20 self-center w-full max-w-3xl px-6 pointer-events-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-4 w-full">
                {navItems.map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: msToS(MAIN_TITLE_TIMING_MS.navigation.appearDuration),
                            delay: msToS(MAIN_TITLE_TIMING_MS.navigation.appearStart + MAIN_TITLE_TIMING_MS.navigation.stagger * index),
                            ease: "easeOut"
                        }}
                    >
                        <NavButton {...item} onHover={onHoverItem} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
