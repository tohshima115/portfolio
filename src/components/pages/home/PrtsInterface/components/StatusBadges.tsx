import React from 'react';
import type { UpdateItem } from '../index';

export const StatusBadges = ({ updates = [] }: { updates?: UpdateItem[] }) => {
    return (
        <div className="self-end flex flex-col sm:flex-row gap-3 items-end sm:items-center mt-20 mr-10 opacity-80 hover:opacity-100 transition-opacity pointer-events-auto">
            <a href="/rss.xml" className="group px-3 py-1.5 bg-background/50 border border-foreground/10 rounded-full backdrop-blur-md shadow-sm hover:border-accent transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full group-hover:animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                <span className="font-mono text-[9px] text-muted-foreground group-hover:text-accent tracking-widest">SIGNAL_FEED</span>
            </a>

            {/* Updates Dropdown */}
            <div className="relative group">
                <a href="/updates" className="px-3 py-1.5 bg-background/50 border border-foreground/10 rounded-full backdrop-blur-md shadow-sm flex items-center gap-3 hover:border-accent transition-colors">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground group-hover:text-accent tracking-widest transition-colors">SYSTEM ONLINE</span>
                </a>

                {/* Dropdown Content */}
                <div className="absolute right-0 mt-2 w-64 bg-background/80 backdrop-blur-md border border-foreground/10 shadow-lg rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right group-hover:translate-y-0 translate-y-2 pointer-events-none group-hover:pointer-events-auto">
                    <div className="px-4 py-2 border-b border-foreground/10 bg-muted/30">
                        <h3 className="font-mono text-[10px] text-foreground/80 tracking-widest">LATEST UPDATES</h3>
                    </div>
                    <ul className="flex flex-col py-1">
                        {updates.map((update, idx) => (
                            <li key={idx}>
                                <a href={update.url} className="flex flex-col px-4 py-2 hover:bg-muted/50 transition-colors">
                                    <span className="text-xs text-foreground font-medium truncate">{update.title}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${update.type === 'blog' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {update.type.toUpperCase()}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                            {new Date(update.date).toISOString().split('T')[0]}
                                        </span>
                                    </div>
                                </a>
                            </li>
                        ))}
                        {updates.length === 0 && (
                            <li className="px-4 py-3 text-xs text-muted-foreground text-center font-mono">NO RECORDS FOUND</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};
