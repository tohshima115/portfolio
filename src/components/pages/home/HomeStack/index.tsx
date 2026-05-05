import React, { useEffect } from 'react';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import type { UpdateItem } from '../HomeScene/types';
import { StatementSection } from './sections/StatementSection';
import { WorksSection } from './sections/WorksSection';
import { AboutSection } from './sections/AboutSection';
import { CTASection } from './sections/CTASection';
import { HudOverlay } from './visuals/HudOverlay';

const RETURN_THRESHOLD_PX = 30;
const RETURN_COOLDOWN_MS = 800;

// window.scrollY === 0 で上方向の wheel/swipe があったら HomeIntro に戻すよう
// CustomEvent 'home:return-to-hero' を発火する。HomeIntro 側でこれを listen して
// 逆ハードカットを再生し、Hero を再表示する。
function useReturnToHero(): void {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        let lastFireAt = 0;
        let touchY: number | null = null;
        let touchAccum = 0;

        const fire = () => {
            const now = performance.now();
            if (now - lastFireAt < RETURN_COOLDOWN_MS) return;
            lastFireAt = now;
            window.dispatchEvent(new CustomEvent('home:return-to-hero'));
        };

        const onWheel = (e: WheelEvent) => {
            if (window.scrollY > 0) return;
            if (e.deltaY < -RETURN_THRESHOLD_PX) fire();
        };

        const onTouchStart = (e: TouchEvent) => {
            touchY = e.touches[0]?.clientY ?? null;
            touchAccum = 0;
        };
        const onTouchMove = (e: TouchEvent) => {
            if (window.scrollY > 0) {
                touchY = null;
                touchAccum = 0;
                return;
            }
            if (touchY === null) return;
            const y = e.touches[0]?.clientY ?? touchY;
            const dy = y - touchY; // 下方向スワイプは正
            touchY = y;
            if (dy > 0) {
                touchAccum += dy;
                if (touchAccum > RETURN_THRESHOLD_PX * 2) fire();
            } else {
                touchAccum = 0;
            }
        };
        const onTouchEnd = () => {
            touchY = null;
            touchAccum = 0;
        };

        window.addEventListener('wheel', onWheel, { passive: true });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onTouchEnd, { passive: true });
        return () => {
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, []);
}

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
    useReturnToHero();

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
