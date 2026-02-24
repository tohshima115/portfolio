import React from 'react';
import { motion } from 'framer-motion';
import { NavButton } from './NavButton';
import { MAIN_TITLE_TIMING_MS, msToS } from '../config/animationTiming';
import { FolderGit2Icon } from '@/components/ui/FolderGit2Icon';
import { FileTextIcon } from '@/components/ui/FileTextIcon';
import { IdCardIcon } from '@/components/ui/IdCardIcon';
import { ConnectIcon } from '@/components/ui/ConnectIcon';

interface NavigationGridProps {
    onHoverItem?: (label: string | null) => void;
}

export const NavigationGrid = ({ onHoverItem }: NavigationGridProps) => {
    const navItems = [
        { label: "PROJECTS", href: "/works", customIcon: (ref: any) => <FolderGit2Icon ref={ref} size={20} className="mb-0.5" /> },
        { label: "BLOG", href: "/blog", customIcon: (ref: any) => <FileTextIcon ref={ref} size={20} className="mb-0.5" /> },
        { label: "ABOUT", href: "/about", customIcon: (ref: any) => <IdCardIcon ref={ref} size={20} className="mb-0.5" /> },
        { label: "CONTACT", href: "/contact", customIcon: (ref: any) => <ConnectIcon ref={ref} size={20} className="mb-0.5" /> },
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
