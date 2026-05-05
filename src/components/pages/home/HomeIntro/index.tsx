import React, { useCallback, useEffect, useRef, useState } from 'react';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import type { UpdateItem } from '../HomeScene/types';
import { HardCutOverlay, type CutPhase } from './HardCutOverlay';
import { HeroSection } from './HeroSection';
import { IntroShutterOverlay } from './IntroShutterOverlay';
import { useIntroProgress } from './useIntroProgress';

export type { UpdateItem };

// HomeIntro: Hero (常駐) + Hero→Statement への progressive ハードカット担当。
//
// 案 B (アイリス・シャッター) を採用:
//   - useIntroProgress が wheel/touch/key/scrollbar drag を蓄積し、
//     0..1 の progress を吐く (SNAP_THRESHOLD_PX 蓄積で確定)
//   - IntroShutterOverlay が上下から背景色のシャッターを progress * 50vh まで
//     閉じてくる。境界に accent ラインが光る
//   - progress 1.0 = 画面全体が背景色 → 即時 phase='scroll' (シャッター越しに
//     Statement が現れる演出。白フラッシュは不要)
//   - 入力が止まると蓄積が緩やかに 0 へ減衰 (= 誤操作でシャッターが開いて Hero に戻る)
//   - Hero に戻る時 (triggerToHero) は 既存 white flash (HardCutOverlay) を維持
//
// outer は position:fixed (z-[5]) なので Astro レイアウトに高さを取らない。
// HardCutOverlay は createPortal で document.body 直下にマウントされる。

// triggerToHero (Hero 復帰) 時の white flash 用。
// triggerHardCut (Statement へ) は shutter が閉じきっているので flash 不要。
const COVER_MS = 90;
const REVEAL_MS = 110;

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
    //   ・html/body の overflow は触らない (scrollbar は常時表示)
    //   ・wheel/touch/key/scrollbar drag は useIntroProgress が捕食 / 検知
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

    // === progress 状態 (rAF throttle で setState 頻度抑制) ===
    // 案 B では shader 連動 (chaos) は使わないので MotionValue は不要、
    // shutter overlay 用の React state だけで完結する。
    const [progress, setProgress] = useState(0);
    const progressRef = useRef(0);
    const setProgressRafRef = useRef<number | null>(null);

    const handleProgress = useCallback((p: number) => {
        progressRef.current = p;
        if (setProgressRafRef.current !== null) return;
        setProgressRafRef.current = requestAnimationFrame(() => {
            setProgressRafRef.current = null;
            setProgress(progressRef.current);
        });
    }, []);

    useEffect(() => {
        return () => {
            if (setProgressRafRef.current !== null) {
                cancelAnimationFrame(setProgressRafRef.current);
            }
        };
    }, []);

    // === 進捗 1.0 で発火する遷移 (Hero → Statement) ===
    // shutter が閉じきった瞬間 (画面 = 背景色) → 即時 phase='scroll' で OK
    const triggerHardCut = useCallback(() => {
        if (phaseRef.current !== 'intro') return;
        setPhase('scroll');
        releaseScroll();
    }, [releaseScroll]);

    // === Hero に戻る (HomeStack 上端からの上方向 wheel/swipe で発火) ===
    // 戻る時は white flash (HardCutOverlay) で切替: shutter は閉じてないため
    const triggerToHero = useCallback(() => {
        if (phaseRef.current !== 'scroll') return;
        progressRef.current = 0;
        setProgress(0);

        if (reducedMotion) {
            lockScroll();
            setPhase('intro');
            return;
        }
        setPhase('cover');
        window.setTimeout(() => {
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

    useIntroProgress({
        onProgress: handleProgress,
        onComplete: triggerHardCut,
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
                {phase === 'intro' && (
                    <IntroShutterOverlay
                        progress={progress}
                        reducedMotion={reducedMotion}
                    />
                )}
            </section>
            <HardCutOverlay phase={cutPhase} reducedMotion={reducedMotion} />
        </>
    );
};
