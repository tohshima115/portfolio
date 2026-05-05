// Phase 1 placeholder. Phase 3 で本実装に差し替える。
// Status (退職時期) + Contact、同心円 SVG + ScrambleText。

import type { UpdateItem } from '../../HomeScene/types';

interface Props {
    updates?: UpdateItem[];
}

export const CTASection: React.FC<Props> = ({ updates: _updates = [] }) => {
    return (
        <section
            data-section="cta"
            className="relative w-full min-h-screen flex items-center justify-center bg-background"
        >
            <div className="font-mono text-xs uppercase tracking-[0.4em] text-muted-foreground">
                + CTA / 04 — placeholder
            </div>
        </section>
    );
};
