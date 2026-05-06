import React from 'react';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import type { UpdateItem } from '../HomeScene/types';
import { StatementSection } from './sections/StatementSection';
import { WorksSection } from './sections/WorksSection';
import { AboutSection } from './sections/AboutSection';
import { CTASection } from './sections/CTASection';
import { HudOverlay } from './visuals/HudOverlay';

export type { UpdateItem };

// HomeStack: Hero 直下のネイティブ縦スクロール本体。
// Statement / Works / About / CTA の 4 セクションを通常フローで縦に並べる。
// 各セクションが独自に IntersectionObserver / ScrollTrigger で reveal/parallax を持つ。
//
// HomeIntro が sticky pin 構造になり、scrollY 0..480 が Hero の dolly range、
// 480px 以降からこのスタックが見え始める。Statement に戻るのも単に上方向
// スクロールするだけで自動的に Hero pin range に再突入する (専用イベント不要)。
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
            <StatementSection />
            <WorksSection />
            <AboutSection />
            <CTASection updates={updates} />
            <HudOverlay />
        </main>
    );
};
