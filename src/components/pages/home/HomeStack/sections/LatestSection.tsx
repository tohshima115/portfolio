import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CornerLabel } from '../primitives/CornerLabel';
import { GridLayer } from '../visuals/GridLayer';
import { SectionFrame } from '../visuals/SectionFrame';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { UpdateItem } from '../../HomeScene/types';

interface Props {
    updates: UpdateItem[];
}

const formatDate = (iso: string): string => {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
};

export const LatestSection: React.FC<Props> = ({ updates }) => {
    const ref = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();
    const inView = useInView(ref, { once: true, amount: 0.3 });

    if (updates.length === 0) return null;

    return (
        <section
            ref={ref}
            data-section="latest"
            className="relative w-full bg-background"
        >
            <div className="relative w-full min-h-[60vh] py-24 md:py-28">
                <GridLayer size={32} opacity={0.04} />
                <SectionFrame inset={32} />

                <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12">
                    <div className="flex items-start justify-between mb-12">
                        <CornerLabel label="LATEST" id="03" />
                        <span className="font-mono text-2xs uppercase tracking-[0.4em] text-muted-foreground/60">
                            {updates.length} entries
                        </span>
                    </div>

                    <ul className="border-t border-foreground/10">
                        {updates.map((u, i) => (
                            <UpdateRow
                                key={u.url}
                                update={u}
                                index={i}
                                inView={inView}
                                reduced={reduced}
                            />
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

interface RowProps {
    update: UpdateItem;
    index: number;
    inView: boolean;
    reduced: boolean;
}

const UpdateRow: React.FC<RowProps> = ({ update, index, inView, reduced }) => {
    const tag = update.type === 'blog' ? 'BLOG' : 'PROJECT';
    return (
        <motion.li
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={
                inView || reduced
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 12 }
            }
            transition={{
                duration: 0.5,
                delay: reduced ? 0 : 0.1 + index * 0.06,
                ease: [0.22, 1, 0.36, 1],
            }}
            className="border-b border-foreground/10"
        >
            <a
                href={update.url}
                className="block py-5 md:py-6 group hover:bg-foreground/[0.02] transition-colors"
            >
                <div className="grid grid-cols-[max-content_max-content_1fr] md:grid-cols-[110px_80px_1fr_auto] gap-x-3 md:gap-x-6 gap-y-1 items-baseline">
                    <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground tabular-nums">
                        {formatDate(update.date)}
                    </span>
                    <span className="font-mono text-2xs uppercase tracking-[0.3em] text-accent">
                        {tag}
                    </span>
                    <span className="col-span-3 md:col-span-1 font-sans text-foreground/90 group-hover:text-foreground text-sm md:text-base leading-snug">
                        {update.title}
                    </span>
                    <span
                        aria-hidden
                        className="hidden md:inline font-mono text-xs text-muted-foreground group-hover:text-accent transition-colors"
                    >
                        →
                    </span>
                </div>
            </a>
        </motion.li>
    );
};
