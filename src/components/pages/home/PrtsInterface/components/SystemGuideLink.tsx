import React from 'react';

export const SystemGuideLink = () => {
    return (
        <div className="absolute bottom-20 left-10 hidden lg:block pointer-events-auto">
            <a href="/system" className="font-mono text-[10px] text-muted-foreground hover:text-accent tracking-[0.2em] transition-colors border-b border-transparent hover:border-accent pb-1 flex items-center gap-2 group">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 overflow-hidden inline-block">{">>"}</span>
                SYSTEM_GUIDE
            </a>
        </div>
    );
};
