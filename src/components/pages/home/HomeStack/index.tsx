import React from 'react';
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
