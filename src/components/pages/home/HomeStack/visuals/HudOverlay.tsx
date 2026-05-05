import { useSectionProgress } from '../hooks/useSectionProgress';

const SECTION_LABELS: Record<string, string> = {
    statement: 'STATEMENT',
    works: 'WORKS',
    about: 'ABOUT',
    cta: 'CTA',
};
const SECTION_IDS: Record<string, string> = {
    statement: '01',
    works: '02',
    about: '03',
    cta: '04',
};
const ORDERED = ['statement', 'works', 'about', 'cta'] as const;

// 常駐 HUD: 右上 = active section + ID、左下 = scroll progress、
// 右端中央 = section indicator (click でその section へ smooth scroll)。
// pointer-events: none を基本にし、clickable なインジケータだけ pointer-events: auto。
export const HudOverlay: React.FC = () => {
    const { activeId, progress } = useSectionProgress();
    const pct = Math.round(progress * 100);
    const barLen = 8;
    const filled = Math.max(0, Math.min(barLen, Math.round(progress * barLen)));
    const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);

    const label = activeId ? SECTION_LABELS[activeId] ?? activeId.toUpperCase() : '';
    const id = activeId ? SECTION_IDS[activeId] ?? '' : '';

    return (
        <div
            aria-hidden
            className="fixed inset-0 z-[80] pointer-events-none font-mono uppercase text-[10px] tracking-[0.3em] text-muted-foreground"
        >
            {/* 右上: section name + ID */}
            <div className="absolute top-4 right-6 hidden md:flex items-center gap-2">
                <span className="text-accent">+</span>
                <span>{label}</span>
                {id && <span className="text-muted-foreground/60">/ {id}</span>}
            </div>

            {/* 左下: progress bar + % + 座標 */}
            <div className="absolute bottom-4 left-6 hidden md:flex items-center gap-3">
                <span className="text-foreground/60">{bar}</span>
                <span>{String(pct).padStart(2, '0')}%</span>
                <span className="text-muted-foreground/40">LAT 35.6762  LON 139.6503</span>
            </div>

            {/* 右端中央: section indicator */}
            <nav
                aria-label="Section navigation"
                className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto"
            >
                {ORDERED.map((sid) => {
                    const isActive = sid === activeId;
                    return (
                        <button
                            key={sid}
                            type="button"
                            onClick={() => {
                                const el = document.querySelector(
                                    `[data-section="${sid}"]`,
                                );
                                el?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            aria-label={`Jump to ${SECTION_LABELS[sid]}`}
                            className="group flex items-center gap-2 cursor-pointer"
                        >
                            <span
                                className={`block h-px transition-all duration-300 ${
                                    isActive
                                        ? 'w-6 bg-accent'
                                        : 'w-3 bg-foreground/30 group-hover:bg-foreground/60'
                                }`}
                            />
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};
