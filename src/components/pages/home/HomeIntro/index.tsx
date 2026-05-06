import React, { useEffect, useState } from 'react';
import { useMotionValue } from 'framer-motion';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import type { UpdateItem } from '../HomeScene/types';
import { HeroSection } from './HeroSection';

export type { UpdateItem };

// HomeIntro: Hero を 1 viewport 分 sticky pin で張り付かせ、
// scrollY 0..SCROLL_RANGE_PX を dolly progress 0..1 にマップする構造。
//
// 利点:
//   - Hero と Statement のスクロールが連続した 1 本のネイティブスクロールになる
//     → Lenis の smooth scroll が Hero でも効く / scrollbar が分裂しない
//   - useIntroProgress の wheel/touch 自前捕食、phase state、HardCutOverlay、
//     IntroShutterOverlay、useReturnToHero がすべて不要 (スクロール位置だけで完結)
//
// 動作:
//   - 0 → SCROLL_RANGE_PX: Hero が sticky pin で画面に張り付き、dolly が 0→1 に進行
//     (背景 contour と前景の HeroLayer が一緒にカメラ的に引いていき、後半でブラー)
//   - SCROLL_RANGE_PX で dolly opacity = 0 → Hero が完全消失
//   - そのまま下にスクロールすると pin wrapper が終わり、Statement が見えてくる
//   - Statement から上方向にスクロールすれば Hero pin range に再突入し、
//     dolly が逆方向に進行して Hero が復活 (専用イベント不要)
//
// reduced-motion:
//   - dolly を Hero に渡さない & wrapper の追加高さを取らない
//     (= Hero は単純な 100vh のセクションとして表示)

const SCROLL_RANGE_PX = 480;

const readSkipIntroFlag = (): boolean => {
    if (typeof window === 'undefined') return false;
    return Boolean(
        (window as unknown as { __prtsSkipIntro?: boolean }).__prtsSkipIntro,
    );
};

export const HomeIntro = ({ updates = [] }: { updates?: UpdateItem[] }) => {
    const [skipIntro] = useState<boolean>(readSkipIntroFlag);
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
        const u = () => setReducedMotion(rm.matches);
        u();
        rm.addEventListener('change', u);
        return () => rm.removeEventListener('change', u);
    }, []);

    // 同一オリジンリンクは WebGL トランジションへ
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

    // dolly progress = scrollY / SCROLL_RANGE_PX (0..1 にクランプ)
    const progressMv = useMotionValue(0);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (reducedMotion) {
            progressMv.set(0);
            return;
        }
        const update = () => {
            const p = Math.min(
                1,
                Math.max(0, window.scrollY / SCROLL_RANGE_PX),
            );
            progressMv.set(p);
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, [progressMv, reducedMotion]);

    return (
        <section
            className="relative w-full"
            style={{
                height: reducedMotion
                    ? '100vh'
                    : `calc(100vh + ${SCROLL_RANGE_PX}px)`,
            }}
            onClickCapture={handleLinkClick}
            data-home-intro
        >
            <div className="sticky top-0 w-full h-screen overflow-hidden bg-background">
                <HeroSection
                    skipIntro={skipIntro}
                    updates={updates}
                    active={true}
                    dolly={reducedMotion ? undefined : progressMv}
                />
            </div>
        </section>
    );
};
