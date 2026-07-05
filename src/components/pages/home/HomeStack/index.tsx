import React, { useEffect } from 'react';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import type { UpdateItem } from '../HomeScene/types';
import { WorksSection } from './sections/WorksSection';
import { AboutSection } from './sections/AboutSection';
import { LatestSection } from './sections/LatestSection';
import { CTASection } from './sections/CTASection';
import { HudOverlay } from './visuals/HudOverlay';

export type { UpdateItem };

// HomeStack: Hero 直下のネイティブ縦スクロール本体。
// Works (Lead → Flagship → Ops) → About → Latest → CTA の構成を縦に並べる。
// 各セクションが独自に IntersectionObserver / ScrollTrigger で reveal/parallax を持つ。
//
// HomeIntro が fixed + scroll spacer 構造、scrollY 0..1200 が Hero の dolly range、
// 1200px 以降からこのスタックが見え始める。Works に戻るのも単に上方向スクロールで
// 自動的に Hero pin range に再突入する (専用イベント不要)。
//
// internal リンクは WebGL transition、外部リンクは通常遷移 (HomeIntro と同じ挙動)。

interface Props {
    updates?: UpdateItem[];
}

export const HomeStack: React.FC<Props> = ({ updates = [] }) => {
    // pin 復元用 ScrollTrigger.refresh()。
    //
    // 各セクションの useScrollScene は gsap を dynamic import するので、
    // ScrollTrigger.create() が走るタイミングは「HomeIntro の 1200px spacer
    // 挿入」「画像/フォント load 完了」「Lenis 初期化」と非同期で混ざる。
    // 初期計算した pin start/end が実レイアウトとズレた状態で固定されると、
    // リロード直後に「pin 自体が建たない」状態になる (各セクションは
    // invalidateOnRefresh: true で refresh を待っている)。
    //
    // SPA 遷移 (ロゴクリック → /) では JS が既にロード済で全 island が
    // 即マウントするためズレないが、hard reload では非同期 import の遅延が
    // 効いてズレる。明示的に window.load 後 + microtask 後の 2 タイミングで
    // refresh を叩いて、layout 確定後の値で pin 範囲を再計測する。
    useEffect(() => {
        if (typeof window === 'undefined') return;
        let cancelled = false;
        const refresh = async () => {
            try {
                const stMod = await import('gsap/ScrollTrigger');
                if (cancelled) return;
                stMod.ScrollTrigger.refresh();
            } catch {
                /* gsap 未ロードならスキップ */
            }
        };
        // microtask 後 (各 section の useEffect が走り終わった後)
        const t1 = window.setTimeout(refresh, 0);
        // 画像/フォント等の load 完了後にもう一度
        const t2 = window.setTimeout(refresh, 200);
        const onLoad = () => refresh();
        if (document.readyState === 'complete') {
            window.setTimeout(refresh, 50);
        } else {
            window.addEventListener('load', onLoad, { once: true });
        }
        return () => {
            cancelled = true;
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            window.removeEventListener('load', onLoad);
        };
    }, []);

    const handleLinkClick = (e: React.MouseEvent) => {
        const target = (e.target as HTMLElement).closest('a');
        if (
            target &&
            target.href &&
            !target.href.startsWith('javascript') &&
            !target.href.includes('#')
        ) {
            try {
                const url = new URL(target.href);
                if (url.origin === window.location.origin) {
                    e.preventDefault();
                    playWebGLTransition({
                        url: target.pathname + target.search + target.hash,
                    });
                }
            } catch {
                /* ignore */
            }
        }
    };

    return (
        <main
            className="relative w-full bg-background text-foreground"
            onClickCapture={handleLinkClick}
            data-home-stack
        >
            <WorksSection />
            <AboutSection />
            <LatestSection updates={updates} />
            <CTASection />
            <HudOverlay />
        </main>
    );
};
