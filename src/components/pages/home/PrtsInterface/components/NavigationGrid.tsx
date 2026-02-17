import React from 'react';
import { NavButton } from './NavButton';

export const NavigationGrid = () => {
    const navItems = [
        { label: "ARCHIVES", href: "/works", sub: "Projects" },
        { label: "LOGS", href: "/blog", sub: "Dev & Thoughts" },
        { label: "PROFILE", href: "/about", sub: "Who I Am" },
        { label: "COMM", href: "/contact", sub: "Contact" },
    ];

    return (
        <div className="mt-auto mb-20 self-center w-full max-w-3xl px-6 pointer-events-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                {navItems.map((item) => (
                    <NavButton key={item.label} {...item} />
                ))}
            </div>
        </div>
    );
};
