import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface Heading {
    slug: string;
    text: string;
    depth?: number;
}

interface TableOfContentsProps {
    headings: Heading[];
    projectLink?: string;
    className?: string; // Add className prop
}

const SOURCE_ID = 'project-content-source';

function extractSectionHtml(slug: string): { title: string; html: string } | null {
    if (typeof document === 'undefined') return null;
    const source = document.getElementById(SOURCE_ID);
    if (!source) return null;

    let escapedSlug: string;
    try {
        escapedSlug = (window as any).CSS?.escape?.(slug) ?? slug;
    } catch {
        escapedSlug = slug;
    }
    const headingEl = source.querySelector(`#${escapedSlug}`) as HTMLElement | null;
    if (!headingEl) return null;

    const startLevel = parseInt(headingEl.tagName.slice(1), 10);
    const fragments: string[] = [];
    let cursor = headingEl.nextElementSibling as HTMLElement | null;
    while (cursor) {
        if (/^H[1-6]$/.test(cursor.tagName)) {
            const level = parseInt(cursor.tagName.slice(1), 10);
            if (level <= startLevel) break;
        }
        fragments.push(cursor.outerHTML);
        cursor = cursor.nextElementSibling as HTMLElement | null;
    }
    return {
        title: headingEl.textContent?.trim() ?? '',
        html: fragments.join(''),
    };
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ headings, projectLink, className }) => {
    const [activeSlug, setActiveSlug] = useState<string | null>(null);
    const [section, setSection] = useState<{ title: string; html: string } | null>(null);

    const closeModal = useCallback(() => {
        setActiveSlug(null);
        setSection(null);
    }, []);

    const openSection = useCallback((slug: string) => {
        const extracted = extractSectionHtml(slug);
        if (extracted) {
            setActiveSlug(slug);
            setSection(extracted);
        }
    }, []);

    useEffect(() => {
        if (!activeSlug) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal();
        };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [activeSlug, closeModal]);

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
                    {headings.map((heading, index) => {
                        const indentClass = heading.depth && heading.depth >= 3 ? 'pl-6' : 'pl-2';
                        const isActive = activeSlug === heading.slug;
                        return (
                            <li key={heading.slug} className="group relative">
                                <button
                                    type="button"
                                    onClick={() => openSection(heading.slug)}
                                    className={cn(
                                        'block w-full py-3 pr-2 text-sm font-bold uppercase tracking-wider hover:pl-8 transition-all duration-200 border-b border-black/10 group-hover:bg-white group-hover:text-black flex justify-between items-center text-left',
                                        indentClass,
                                        isActive && 'bg-black text-white pl-8',
                                    )}
                                >
                                    <span>{heading.text}</span>
                                    <span className={cn('text-[10px] opacity-0 group-hover:opacity-100', isActive && 'opacity-100')}>0{index + 1}</span>
                                </button>
                                <div className={cn('absolute left-0 top-0 h-full bg-black transition-all duration-200', isActive ? 'w-1' : 'w-0 group-hover:w-1')} />
                            </li>
                        );
                    })}
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

            {/* Section Modal */}
            {activeSlug && section && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
                    role="dialog"
                    aria-modal="true"
                    aria-label={section.title}
                >
                    {/* Backdrop */}
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={closeModal}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
                    />

                    {/* Panel */}
                    <div className="relative bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl max-h-[85vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b-2 border-black bg-yellow-400 px-6 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold opacity-70 shrink-0">SECTION</span>
                                <h2 className="font-black text-lg uppercase tracking-tight truncate">{section.title}</h2>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="ml-4 shrink-0 w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-colors font-bold"
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
                            <div
                                className="prose prose-neutral max-w-none font-sans
                                    prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                                    prose-h3:text-xl prose-h3:border-l-4 prose-h3:border-yellow-400 prose-h3:pl-3 prose-h3:mt-8
                                    prose-h4:text-base prose-h4:mt-6
                                    prose-p:text-gray-700 prose-p:leading-relaxed
                                    prose-strong:text-black prose-strong:font-bold prose-strong:bg-yellow-100 prose-strong:px-1
                                    prose-li:marker:text-yellow-500
                                    prose-a:text-black prose-a:underline
                                    prose-table:text-sm
                                "
                                dangerouslySetInnerHTML={{ __html: section.html }}
                            />
                        </div>

                        {/* Footer */}
                        <div className="border-t-2 border-black bg-white px-6 py-2 flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">ESC to close</span>
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">#{activeSlug}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableOfContents;
