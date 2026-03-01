import React from 'react';
import { cn } from '@/utils/cn';

interface Heading {
    slug: string;
    text: string;
}

interface TableOfContentsProps {
    headings: Heading[];
    projectLink?: string;
    className?: string; // Add className prop
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ headings, projectLink, className }) => {
    return (
        <div className={cn("relative h-full flex flex-col justify-between font-mono text-black p-6 overflow-hidden", className)}>

            {/* Top Decorative Header */}
            <div>
                <div className="flex justify-between items-start mb-12">
                    <div className="text-4xl font-black writing-vertical-rl transform rotate-180 opacity-20 select-none pointer-events-none">
                        NAVIGATION
                    </div>
                    <div className="w-8 h-8 border-2 border-black flex items-center justify-center">
                        <div className="w-4 h-4 bg-black rotate-45"></div>
                    </div>
                </div>

                {/* Navigation List */}
                <ul className="space-y-0 relative z-10 w-full">
                    {headings.map((heading, index) => (
                        <li key={heading.slug} className="group relative">
                            <a
                                href={`#${heading.slug}`}
                                className="block w-full py-3 px-2 text-sm font-bold uppercase tracking-wider hover:pl-6 transition-all duration-200 border-b border-black/10 group-hover:bg-white group-hover:text-black flex justify-between items-center"
                            >
                                <span>{heading.text}</span>
                                <span className="opacity-0 group-hover:opacity-100 text-[10px]">0{index + 1}</span>
                            </a>
                            {/* Active Indicator (simplified for static) */}
                            <div className="absolute left-0 top-0 h-full w-0 group-hover:w-1 bg-black transition-all duration-200" />
                        </li>
                    ))}
                </ul>
            </div>

            {/* Bottom Action Area */}
            <div className="mt-auto pt-8 border-t-2 border-black mb-12">
                {projectLink ? (
                    <a
                        href={projectLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-black text-white text-center py-4 text-sm font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 group"
                    >
                        <span className="flex items-center justify-center gap-2">
                            Visit Site
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </span>
                    </a>
                ) : (
                    <div className="text-center text-xs opacity-60 font-bold uppercase">
                        Offline Mode
                    </div>
                )}

                <div className="mt-4 flex justify-between text-[10px] font-bold">
                    <span>COORD: 34.05N</span>
                    <span>SEC: A-01</span>
                </div>
            </div>

            {/* Background decoration */}
            <div className="absolute -right-12 bottom-20 text-[120px] font-black opacity-10 pointer-events-none rotate-90 whitespace-nowrap">
                ARCHIVE
            </div>
        </div>
    );
};

export default TableOfContents;
