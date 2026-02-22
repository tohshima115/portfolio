import React from 'react';

interface NavButtonProps {
    href: string;
    label: string;
    onHover?: (label: string | null) => void;
}

export const NavButton = ({ href, label, onHover }: NavButtonProps) => {
    return (
        <a
            href={href}
            className="group relative flex flex-col items-start p-2 pointer-events-auto"
            onMouseEnter={() => onHover && onHover(label)}
            onMouseLeave={() => onHover && onHover(null)}
        >
            <span className="font-mono text-base md:text-lg tracking-widest text-foreground group-hover:text-accent transition-colors z-10 font-bold">
                {label}
            </span>

            {/* Animated Underline */}
            <div className="h-[2px] w-full bg-border mt-2 relative overflow-hidden rounded-sm">
                <div className="absolute inset-y-0 left-0 w-full bg-accent scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
            </div>
        </a>
    );
};
