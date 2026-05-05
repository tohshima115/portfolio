import React, { useCallback, useEffect, useRef, useState } from 'react';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import type { UpdateItem } from '../HomeScene/types';
import { HardCutOverlay, type CutPhase } from './HardCutOverlay';
import { HeroSection } from './HeroSection';
import { useFirstScrollTrigger } from './useFirstScrollTrigger';

export type { UpdateItem };

// HomeIntro: Hero (常駐) + Hero→次セクションへの「1 回限りハードカット」担当。
// 旧 HomeFlat の 6 セクション排他マウント / useSnapInput 蓄積式は廃止。
// ハードカット完了後は html.overflow を解放し、Hero は display:none で消えて
// 通常フローの <HomeStack /> が viewport 上端から見えるようになる。
//
// outer は position:fixed (z-[5]) なので Astro レイアウトに高さを取らない →
// HomeStack が body 直下から始まり、HomeIntro 退場後に位置調整なしで
// HomeStack 先頭セクションが viewport 上端に表示される。
//
// HardCutOverlay は createPortal で document.body に直接マウントされるため、
// HomeIntro が display:none になっても reveal フラッシュの opacity 1→0 が
// 最後まで再生される。

const COVER_MS = 120;
const REVEAL_MS = 120;

const readSkipIntroFlag = (): boolean => {
    if (typeof window === 'undefined') return false;
    return Boolean(
        (window as unknown as { __prtsSkipIntro?: boolean }).__prtsSkipIntro,
    );
};

type IntroPhase = 'intro' | 'cover' | 'reveal' | 'scroll';

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

    // 同一オリジンリンクは WebGL トランジションへ (旧 HomeFlat と同一挙動)
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

    const [phase, setPhase] = useState<IntroPhase>('intro');
    const phaseRef = useRef<IntroPhase>('intro');
    phaseRef.current = phase;

    // intro マウント時に window スクロールを禁止し、フェーズ完了で解放
    useEffect(() => {
        const html = document.documentElement;
        const prevHtmlOverflow = html.style.overflow;
        const prevBodyOverflow = document.body.style.overflow;
        html.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.dataset.homePhase = 'intro';
        window.scrollTo(0, 0);
        return () => {
            html.style.overflow = prevHtmlOverflow;
            document.body.style.overflow = prevBodyOverflow;
            delete document.body.dataset.homePhase;
        };
    }, []);

    const releaseScroll = useCallback(() => {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.dataset.homePhase = 'scroll';
    }, []);

    const triggerHardCut = useCallback(() => {
        if (phaseRef.current !== 'intro') return;
        if (reducedMotion) {
            setPhase('scroll');
            releaseScroll();
            return;
        }
        setPhase('cover');
        window.setTimeout(() => {
            // peak: Hero を退場 + scroll 解禁
            setPhase('reveal');
            releaseScroll();
            window.setTimeout(() => {
                setPhase('scroll');
            }, REVEAL_MS);
        }, COVER_MS);
    }, [reducedMotion, releaseScroll]);

    useFirstScrollTrigger({
        onTrigger: triggerHardCut,
        disabled: phase !== 'intro',
    });

    const heroVisible = phase !== 'scroll';
    const cutPhase: CutPhase =
        phase === 'cover' ? 'cover' : phase === 'reveal' ? 'reveal' : 'idle';

    return (
        <>
            {/*
              outer: fixed inset-0 で viewport を覆う。Astro レイアウトに高さを取らないため、
              下に並ぶ <HomeStack /> は body 直下 (window scroll Y=0) から開始する。
              phase='scroll' で display:none → HomeStack の先頭が viewport 上端に出る。
            */}
            <section
                className="fixed inset-0 z-[5] bg-background overflow-hidden"
                onClickCapture={handleLinkClick}
                style={{ display: heroVisible ? 'block' : 'none' }}
                aria-hidden={!heroVisible}
            >
                <HeroSection
                    skipIntro={skipIntro}
                    updates={updates}
                    active={heroVisible}
                />
            </section>
            <HardCutOverlay phase={cutPhase} reducedMotion={reducedMotion} />
        </>
    );
};
