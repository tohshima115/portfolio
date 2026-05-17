import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import type { UpdateItem } from '../HomeScene/types';
import { HeroSection } from './HeroSection';

export type { UpdateItem };

// HomeIntro: 「fixed Hero + scroll spacer」方式。
//
// 構造:
//   <div style="height: SCROLL_RANGE_PX" />     ← スクロールスペーサー
//   <section style="fixed inset-0 z-5">        ← Hero 本体 (viewport に張り付く)
//     <HeroSection />
//   </section>
//   ↓ 続く HomeStack は body 自然フロー (scrollY=SCROLL_RANGE_PX から開始)
//
// 動作:
//   - scrollY 0..SCROLL_RANGE_PX: Hero が画面を占めつつ dolly progress 0→1 進行
//     (Hero 自体は CSS 的に微動だにしないので sticky の sub-pixel paint 揺れに
//      よる「要素が縦に伸びる」現象が発生しない)
//   - scrollY=SCROLL_RANGE_PX: dolly opacity が 0 → Hero が透明、同時に
//     Statement 上端が viewport 上端に到達 → 視覚的に引き渡し
//   - scrollY > SCROLL_RANGE_PX: HomeStack が natural scroll で続く
//   - 戻りは Statement から上方向 scroll で自動的に Hero pin range に再突入
//
// 利点 (sticky 方式と比較):
//   - Hero が完全 fixed なので 3D 配置が paint 単位で揺れない
//   - スクロールバーは依然 1 本 (spacer がスクロール量を body に提供)
//   - Lenis の smooth scroll は全域で有効

// Hero pin range (= dolly progress 0→1 に必要なスクロール量)。
// 大きいほど引き切るまでに wheel 数回ぶん必要になり、演出にじっくり浸れる。
const SCROLL_RANGE_PX = 1200;

const readSkipIntroFlag = (): boolean => {
    if (typeof window === 'undefined') return false;
    return Boolean(
        (window as unknown as { __prtsSkipIntro?: boolean }).__prtsSkipIntro,
    );
};

// ローディング演出の調整値
// - 初回 (intro 演出あり) は「BOOT_SEQUENCE をしっかり見せる」感
// - skipIntro (リロード / 同セッション内トップ遷移) は「軽く出してすぐ消える」感
//   理由: hydrate + GSAP pin 確定までのラグで HomeStack の folder grid 等が
//   覗くのを覆い隠したいが、毎回がっつり待たせると煩わしい。
// 値は ContourBackground (R3F + WebGL) の初期化が概ね間に合う長さに設定
// (シェーダーコンパイル + 初回描画で数十〜数百 ms かかるため)。
const BOOT_MIN_VISIBLE_MS = 800;
const BOOT_FADE_DURATION_MS = 400;
const BOOT_MIN_VISIBLE_SKIP_MS = 400;
const BOOT_FADE_DURATION_SKIP_MS = 200;

export const HomeIntro = ({ updates = [] }: { updates?: UpdateItem[] }) => {
    const [skipIntro] = useState<boolean>(readSkipIntroFlag);
    const [reducedMotion, setReducedMotion] = useState(false);
    // bootDone: BOOT_SEQUENCE overlay が完全に消えて Hero を描画してよい状態。
    // reducedMotion 時のみ loading 演出をスキップして即時 true (動きを減らしたい人には
    // ローディング演出も出さない)。skipIntro 時は短時間表示する。
    const [bootDone, setBootDone] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
        return false;
    });

    // index.astro が SSR HTML に置く #hero-boot-overlay の制御:
    //   - 通常 (初回訪問): 最低 600ms 待ってから 400ms fade → bootDone=true
    //   - skipIntro (2回目以降): 最低 250ms 待ってから 200ms fade → bootDone=true
    //   - reducedMotion: 即時 display:none + bootDone 最初から true
    // bootDone=false の間 HeroSection を mount しないことで、ロゴアニメ (skipIntro=false 時)
    // は overlay フェード完了後に綺麗に立ち上がる。skipIntro=true 時はロゴ最終状態が
    // overlay 消失後にいきなり現れるが、その間 HomeStack のラグも overlay で覆えている。
    useEffect(() => {
        const overlay = document.getElementById('hero-boot-overlay');
        if (bootDone) {
            if (overlay) overlay.style.display = 'none';
            return;
        }
        const minVisible = skipIntro ? BOOT_MIN_VISIBLE_SKIP_MS : BOOT_MIN_VISIBLE_MS;
        const fadeDuration = skipIntro ? BOOT_FADE_DURATION_SKIP_MS : BOOT_FADE_DURATION_MS;
        const mountTime = performance.now();
        const fadeStartDelay = Math.max(0, minVisible - (performance.now() - mountTime));
        const fadeTimer = window.setTimeout(() => {
            if (overlay) overlay.style.opacity = '0';
            const doneTimer = window.setTimeout(() => {
                if (overlay) overlay.style.display = 'none';
                setBootDone(true);
            }, fadeDuration);
            return () => window.clearTimeout(doneTimer);
        }, fadeStartDelay);
        return () => window.clearTimeout(fadeTimer);
    }, [bootDone, skipIntro]);

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

    // dolly progress = scrollY / SCROLL_RANGE_PX
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

    // Hero が完全消失している間 (dolly progress >= 0.999) は:
    //   - display:none で section ごと DOM から外す
    //     (HeroSection の outer の bg-background が HomeStack を覆い隠さなくなる
    //      + ContourBackground の Canvas の rAF も IntersectionObserver で停止)
    //   - pointer-events も念のため none (display:none と冗長だが安全側に)
    const heroDisplay = useTransform(progressMv, (p: number) =>
        p >= 0.999 ? 'none' : 'block',
    );
    const heroPointerEvents = useTransform(progressMv, (p: number) =>
        p >= 0.999 ? 'none' : 'auto',
    );

    // bootDone=false の間は HeroSection を mount しない (overlay が表示されたまま)。
    // mount を遅延することで ContourBackground の Canvas 起動も framer-motion の
    // intro delay の計時もすべて「overlay フェード完了後」に始まる。

    // ContourBackground は元通り HeroLayer 内に置く (intro 3D animation / マウス連動 /
    // dolly 全部の演出を維持)。bootDone gate により HeroSection mount まで ContourBackground
    // も mount されないので、WebGL 初期化は overlay フェード直後に走る → 多少の明滅が
    // 起こりうる。最低待ち時間を 800ms (skipIntro 400ms) に伸ばしてカバー範囲を広げてある。
    //
    // 将来「初期化完了を検知して bootDone を待つ」完全実装にするには HeroSection 常時 mount +
    // 各 framer-motion intro の bootDone gate が必要 (大改修)。検知用 hook として
    // ContourBackground 内で 'home-contour-ready' window event を発火する仕込みは入れて
    // あるので、いつでも条件に組み込める。

    // reduced-motion: dolly 演出なし、Hero は単純な 100vh セクションとして
    // 通常フローで配置 (Statement と縦並び)
    if (reducedMotion) {
        return (
            <section
                className="relative w-full h-screen bg-background overflow-hidden"
                onClickCapture={handleLinkClick}
                data-home-intro
            >
                {bootDone && (
                    <HeroSection
                        skipIntro={skipIntro}
                        updates={updates}
                        active={true}
                    />
                )}
            </section>
        );
    }

    return (
        <>
            {/* スクロールスペーサー: scrollY 0..SCROLL_RANGE_PX を body に確保。
                これがあることで Hero pin range が単一スクロールバーに連続して反映される */}
            <div
                aria-hidden
                style={{ height: `${SCROLL_RANGE_PX}px`, pointerEvents: 'none' }}
                data-home-intro-spacer
            />
            {/* Hero: viewport に固定。CSS 的に微動だにしないので 3D 配置が安定 */}
            <motion.section
                className="fixed inset-0 z-[5] bg-background overflow-hidden"
                onClickCapture={handleLinkClick}
                data-home-intro
                style={{ display: heroDisplay, pointerEvents: heroPointerEvents }}
            >
                {bootDone && (
                    <HeroSection
                        skipIntro={skipIntro}
                        updates={updates}
                        active={true}
                        dolly={progressMv}
                    />
                )}
            </motion.section>
        </>
    );
};
