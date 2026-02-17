import React from 'react';

interface NavButtonProps {
    href: string;
    label: string;
    sub: string;
}

export const NavButton = ({ href, label, sub }: NavButtonProps) => {
    return (
        <a href={href} className="group relative w-full aspect-[2.5/1] perspective-500">
            {/* Shadow */}
            <div className="absolute top-8 left-2 right-2 h-3 bg-black/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Body */}
            <div className="absolute inset-0 bg-white/90 border border-foreground/5 group-hover:border-accent/60 transition-all duration-300 flex flex-col items-center justify-center gap-0.5 shadow-sm group-hover:shadow-[0_5px_15px_rgba(0,0,0,0.05)] group-hover:-translate-y-1 group-hover:scale-[1.02] backdrop-blur-sm overflow-hidden rounded-[2px]">
                {/* Scanline */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "linear-gradient(transparent 50%, rgba(0,0,0,0.1) 50%)", backgroundSize: "100% 4px" }} />

                <span className="font-mono text-xs md:text-sm tracking-widest text-foreground group-hover:text-accent transition-colors z-10 font-bold">{label}</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wide group-hover:text-accent/80 transition-colors z-10">{sub}</span>
            </div>

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-foreground/20 group-hover:border-accent transition-colors duration-300" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-foreground/20 group-hover:border-accent transition-colors duration-300" />

            {/* Scanline Effect */}
            <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-10 pointer-events-none">
                <div className="w-full h-[200%] bg-gradient-to-b from-transparent via-accent to-transparent animate-[scan_2s_linear_infinite]" />
            </div>
        </a>
    );
};
