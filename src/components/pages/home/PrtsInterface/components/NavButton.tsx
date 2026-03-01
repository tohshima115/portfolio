import React, { useRef } from 'react';

interface AnimatedIconHandle {
    startAnimation: () => void;
    stopAnimation: () => void;
}

interface NavButtonProps {
    href: string;
    label: string;
    icon?: React.ElementType;
    customIcon?: (ref: React.Ref<AnimatedIconHandle>) => React.ReactNode;
    onHover?: (label: string | null) => void;
    highlight?: boolean;
}

export const NavButton = ({ href, label, icon: Icon, customIcon, onHover, highlight }: NavButtonProps) => {
    const iconRef = useRef<AnimatedIconHandle>(null);

    const handleMouseEnter = () => {
        iconRef.current?.startAnimation();
        onHover && onHover(label);
    };

    const handleMouseLeave = () => {
        iconRef.current?.stopAnimation();
        onHover && onHover(null);
    };

    return (
        <a
            href={href}
            className="group relative flex items-center justify-center py-1.5 px-2.5 md:px-3 pointer-events-auto overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Base lower line for non-highlighted items (always present) */}
            {!highlight && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-border z-0" />
            )}

            {/* Expanding Primary Block */}
            <div
                className={`absolute bottom-0 left-0 w-full bg-accent transition-all duration-300 ease-out z-0 
                ${highlight ? "h-[2px] group-hover:h-full" : "h-0 group-hover:h-full"}`}
            />

            {/* Content Layer */}
            <span className={`relative z-10 font-mono text-base md:text-lg tracking-widest font-bold flex items-center gap-2 transition-colors duration-300 
                ${highlight ? "text-accent group-hover:text-background" : "text-foreground group-hover:text-background"}`}>
                {customIcon ? customIcon(iconRef) : (Icon && <Icon className="w-5 h-5 mb-0.5" />)}
                {label}
            </span>
        </a>
    );
};
