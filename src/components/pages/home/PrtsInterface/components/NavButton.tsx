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
}

export const NavButton = ({ href, label, icon: Icon, customIcon, onHover }: NavButtonProps) => {
    const iconRef = useRef<AnimatedIconHandle>(null);

    return (
        <a
            href={href}
            className="group relative flex flex-col items-start p-2 pointer-events-auto"
            onMouseEnter={() => {
                iconRef.current?.startAnimation();
                onHover && onHover(label);
            }}
            onMouseLeave={() => {
                iconRef.current?.stopAnimation();
                onHover && onHover(null);
            }}
        >
            <span className="font-mono text-base md:text-lg tracking-widest text-foreground group-hover:text-accent transition-colors z-10 font-bold flex items-center gap-2">
                {customIcon ? customIcon(iconRef) : (Icon && <Icon className="w-5 h-5 mb-0.5" />)}
                {label}
            </span>

            {/* Animated Underline */}
            <div className="h-[2px] w-full bg-border mt-2 relative overflow-hidden rounded-sm">
                <div className="absolute inset-y-0 left-0 w-full bg-accent scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
            </div>
        </a>
    );
};
