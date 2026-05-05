import React from 'react';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import type { UpdateItem } from '../HomeScene/types';
import { StatementSection } from './sections/StatementSection';
import { WorksSection } from './sections/WorksSection';
import { AboutSection } from './sections/AboutSection';
import { CTASection } from './sections/CTASection';

export type { UpdateItem };

// HomeStack: Hero 直下のネイティブ縦スクロール本体。
// Statement / Works / About / CTA の 4 セクションを通常フローで縦に並べる。
// 旧 HomeFlat の排他的 DOM マウントは廃止し、各セクションが独自に
// IntersectionObserver / ScrollTrigger で reveal/parallax を持つ。
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
        </main>
    );
};
