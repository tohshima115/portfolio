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
    skipIntro?: boolean;
}

export const NavigationGrid = ({ onHoverItem, skipIntro = false }: NavigationGridProps) => {
    const navItems = [
        { label: "PROJECTS", href: "/projects", customIcon: (ref: any) => <FolderGit2Icon ref={ref} size={20} className="mb-0.5" />, highlight: true },
        { label: "BLOG", href: "/blog", customIcon: (ref: any) => <FileTextIcon ref={ref} size={20} className="mb-0.5" /> },
        { label: "ABOUT", href: "/about", customIcon: (ref: any) => <IdCardIcon ref={ref} size={20} className="mb-0.5" /> },
        { label: "CONTACT", href: "/contact", customIcon: (ref: any) => <ConnectIcon ref={ref} size={20} className="mb-0.5" /> },
    ];

    return (
        <>
        {/* Desktop: 横1列 */}
        <div className="hidden md:block mt-auto mb-20 self-center w-full max-w-3xl px-6 pointer-events-auto">
            <div className="flex flex-row items-end justify-between gap-4 w-full">
                {navItems.map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={skipIntro ? false : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={skipIntro ? { duration: 0 } : {
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

        {/* Mobile: 2×2 グリッド。3D transform は使わず通常フローで配置。
            translateZ を使うとヒットテストの投影位置がずれてタップが届かなくなる。 */}
        <div className="md:hidden mt-auto mb-8 self-center w-full px-6 pointer-events-auto">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full">
                {navItems.map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={skipIntro ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={skipIntro ? { duration: 0 } : {
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
        </>
    );
};
