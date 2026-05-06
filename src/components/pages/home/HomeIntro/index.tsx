import React, { useCallback, useEffect, useRef, useState } from 'react';
import { animate, useMotionValue } from 'framer-motion';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import type { UpdateItem } from '../HomeScene/types';
import { HardCutOverlay, type CutPhase } from './HardCutOverlay';
import { HeroSection } from './HeroSection';
import { IntroShutterOverlay } from './IntroShutterOverlay';
import { useIntroProgress } from './useIntroProgress';

export type { UpdateItem };

// HomeIntro: Hero (常駐) + Hero→Statement への progressive 遷移担当。
//
// 2 つの variant を INTRO_VARIANT 定数で切替:
//
// 'dolly-blur' (案 G、現行デフォルト):
//   - useIntroProgress の 0..1 を progressMv (MotionValue) に流す
//   - HeroSection 側 motion.div / ContourBackground canvas に scale + filter:blur + opacity
//   - 「カメラが引き → 閾値で強引き+ブラー → Statement に遷移」を CSS だけで実現
//   - HUD overlay は出さない (純粋な視覚効果のみ)
//   - 戻り (triggerToHero) は progressMv を 350ms で 0 へ tween 逆再生 (white flash 不使用)
//
// 'shutter' (案 B):
//   - IntroShutterOverlay が上下から背景色のシャッターを progress * 50vh まで閉じてくる
//   - progress 1.0 = 画面全体が背景色 → 即時 phase='scroll'
//   - 戻り (triggerToHero) は white flash (HardCutOverlay) で切替
//
// 共通:
//   - useIntroProgress が wheel/touch/key/scrollbar drag を蓄積し 0..1 progress を吐く
//   - 入力が止まると蓄積が緩やかに 0 へ減衰
//   - outer は position:fixed (z-[5]) で Astro レイアウトに高さを取らない
//   - HardCutOverlay は createPortal で document.body 直下にマウント

type IntroVariant = 'shutter' | 'dolly-blur';
// IntroVariant 型に widening するため as でキャスト (両 variant の分岐が常に有効になるよう型を広げておく)。
const INTRO_VARIANT = 'dolly-blur' as IntroVariant;

// shutter variant の triggerToHero 時に使う white flash の duration。
const COVER_MS = 90;
const REVEAL_MS = 110;
// dolly-blur variant の triggerToHero 時の dolly 逆再生 duration (ms 換算は ease 込みで体感 350ms)。
const DOLLY_REVERSE_DURATION_S = 0.35;

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

    // === progress 状態 ===
    // - progress (React state): shutter overlay の HUD 用 (rAF throttle で setState 頻度抑制)
    // - progressMv (MotionValue): dolly-blur 用に 60fps 即時反映 (HeroSection / ContourBackground が購読)
    const [progress, setProgress] = useState(0);
    const progressRef = useRef(0);
    const progressMv = useMotionValue(0);
    const setProgressRafRef = useRef<number | null>(null);

    const handleProgress = useCallback((p: number) => {
        progressRef.current = p;
        progressMv.set(p);
        if (setProgressRafRef.current !== null) return;
        setProgressRafRef.current = requestAnimationFrame(() => {
            setProgressRafRef.current = null;
            setProgress(progressRef.current);
        });
    }, [progressMv]);

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
    // dolly-blur variant: progressMv を 0 へ tween し dolly+blur を逆再生 (white flash なし)
    // shutter variant:    既存の cover/reveal white flash で切替
    const triggerToHero = useCallback(() => {
        if (phaseRef.current !== 'scroll') return;

        if (INTRO_VARIANT === 'dolly-blur' && !reducedMotion) {
            // 戻った瞬間 phase='intro' にして HeroSection を表示。
            // dolly はまだ高い値なので「引いてボケた状態の Hero」が現れ、
            // そこから 350ms かけて identity (= 元の Hero) に戻る。
            lockScroll();
            setPhase('intro');
            const start = progressMv.get() || 1;
            animate(start, 0, {
                duration: DOLLY_REVERSE_DURATION_S,
                ease: [0.83, 0, 0.17, 1],
                onUpdate: (v) => {
                    progressRef.current = v;
                    progressMv.set(v);
                    setProgress(v);
                },
            });
            return;
        }

        // shutter variant / reduced-motion 共通の即時/フラッシュ復帰
        progressRef.current = 0;
        setProgress(0);
        progressMv.set(0);

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
    }, [reducedMotion, lockScroll, progressMv]);

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
                    dolly={INTRO_VARIANT === 'dolly-blur' && !reducedMotion ? progressMv : undefined}
                />
                {phase === 'intro' && INTRO_VARIANT === 'shutter' && (
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
