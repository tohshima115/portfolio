import { useEffect, useState } from 'react';

// HomeStack 配下の data-section 要素を集計し、
// (1) viewport center に最も近い active section の id
// (2) 全体の scroll progress (0..1)
// を返す。HudOverlay が常駐表示で参照する。
//
// passive: true の scroll/resize リスナー + rAF throttle で 60fps を保つ。

export interface SectionProgressState {
    activeId: string | null;
    progress: number;
}

export function useSectionProgress(): SectionProgressState {
    const [state, setState] = useState<SectionProgressState>({
        activeId: null,
        progress: 0,
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        let rafScheduled = false;

        const compute = () => {
            rafScheduled = false;
            const sections = Array.from(
                document.querySelectorAll<HTMLElement>('[data-section]'),
            );
            const scrollY = window.scrollY;
            const docHeight =
                document.documentElement.scrollHeight - window.innerHeight;
            const progress =
                docHeight > 0
                    ? Math.min(1, Math.max(0, scrollY / docHeight))
                    : 0;
            const center = scrollY + window.innerHeight / 2;
            let bestId: string | null = null;
            let bestDist = Infinity;
            for (const el of sections) {
                const rect = el.getBoundingClientRect();
                const top = rect.top + scrollY;
                const elCenter = top + rect.height / 2;
                const dist = Math.abs(elCenter - center);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestId = el.dataset.section ?? null;
                }
            }
            setState((prev) =>
                prev.activeId === bestId && Math.abs(prev.progress - progress) < 0.001
                    ? prev
                    : { activeId: bestId, progress },
            );
        };

        const onScroll = () => {
            if (rafScheduled) return;
            rafScheduled = true;
            requestAnimationFrame(compute);
        };

        compute();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    return state;
}
