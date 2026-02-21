import React from 'react';
import { NavButton } from './NavButton';

interface NavigationGridProps {
    onHoverItem?: (label: string | null) => void;
}

export const NavigationGrid = ({ onHoverItem }: NavigationGridProps) => {
    const navItems = [
        { label: "ARCHIVES", href: "/works", sub: "Projects" },
        { label: "LOGS", href: "/blog", sub: "Dev & Thoughts" },
        { label: "PROFILE", href: "/about", sub: "Who I Am" },
        { label: "COMM", href: "/contact", sub: "Contact" },
    ];

    return (
        <div className="mt-auto mb-20 self-center w-full max-w-3xl px-6 pointer-events-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-4 w-full">
                {navItems.map((item) => (
                    <NavButton key={item.label} {...item} onHover={onHoverItem} />
                ))}
            </div>
        </div>
    );
};
