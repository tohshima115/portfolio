import React from 'react';

export const StatusBadges = () => {
    return (
        <div className="self-end flex flex-col sm:flex-row gap-3 items-end sm:items-center mt-20 mr-10 opacity-80 hover:opacity-100 transition-opacity pointer-events-auto">
            <a href="/rss.xml" className="group px-3 py-1.5 bg-background/50 border border-foreground/10 rounded-full backdrop-blur-md shadow-sm hover:border-accent transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full group-hover:animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                <span className="font-mono text-[9px] text-muted-foreground group-hover:text-accent tracking-widest">SIGNAL_FEED</span>
            </a>
            <div className="px-3 py-1.5 bg-background/50 border border-foreground/10 rounded-full backdrop-blur-md shadow-sm flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                </span>
                <span className="font-mono text-[9px] text-muted-foreground tracking-widest">SYSTEM ONLINE</span>
            </div>
        </div>
    );
};
