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

    // intro マウント時:
    //   ・html/body の overflow は触らない (scrollbar は常時表示したい)
    //   ・wheel/touch/key だけ useFirstScrollTrigger で捕食し、ネイティブ scroll は起きない
    //   ・scrollbar の drag だけは捕食できないので、scroll イベントを検知して
    //     scrollY > 0 になったら triggerHardCut (= Statement へ進む) を発火する
    useEffect(() => {
        document.body.dataset.homePhase = 'intro';
        window.scrollTo(0, 0);
        return () => {
            delete document.body.dataset.homePhase;
        };
    }, []);

    const releaseScroll = useCallback(() => {
        document.body.dataset.homePhase = 'scroll';
    }, []);

    const lockScroll = useCallback(() => {
        document.body.dataset.homePhase = 'intro';
        window.scrollTo(0, 0);
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

    // HomeStack 側で「window.scrollY === 0 + 上方向 wheel/swipe」を検知すると
    // CustomEvent 'home:return-to-hero' が来る。それを受けて逆ハードカットで Hero に戻す。
    const triggerToHero = useCallback(() => {
        if (phaseRef.current !== 'scroll') return;
        if (reducedMotion) {
            lockScroll();
            setPhase('intro');
            return;
        }
        setPhase('cover');
        window.setTimeout(() => {
            // peak: scroll を再ロック + Hero 再表示
            lockScroll();
            setPhase('reveal');
            window.setTimeout(() => {
                setPhase('intro');
            }, REVEAL_MS);
        }, COVER_MS);
    }, [reducedMotion, lockScroll]);

    useEffect(() => {
        const onReturn = () => triggerToHero();
        window.addEventListener('home:return-to-hero', onReturn);
        return () => window.removeEventListener('home:return-to-hero', onReturn);
    }, [triggerToHero]);

    // intro 中の scrollbar drag を検知して Statement へ進める。
    // wheel/touch/key は useFirstScrollTrigger が preventDefault で捕食しているため、
    // ここで検知される scrollY 変動は実質 scrollbar drag のみ。
    useEffect(() => {
        const onScroll = () => {
            if (phaseRef.current !== 'intro') return;
            if (window.scrollY > 4) {
                triggerHardCut();
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [triggerHardCut]);

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
