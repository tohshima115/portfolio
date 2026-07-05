import { useSectionProgress } from '../hooks/useSectionProgress';

// 右上ラベル用の辞書 (works-ops = 横スクロール部) も含めて全 active id を網羅する。
const SECTION_LABELS: Record<string, string> = {
    statement: 'STATEMENT',
    works: 'WORKS · FLAGSHIP',
    'works-ops': 'WORKS · OPS',
    about: 'ABOUT',
    cta: 'CTA',
};
const SECTION_IDS: Record<string, string> = {
    statement: '01',
    works: '02',
    'works-ops': '02·OPS',
    about: '03',
    cta: '04',
};
// 常駐 HUD: 右上 = active section + ID、左下 = scroll progress。
// pointer-events: none。
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
            className="fixed inset-0 z-[80] pointer-events-none font-mono uppercase text-2xs tracking-[0.3em] text-muted-foreground"
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
        </div>
    );
};
