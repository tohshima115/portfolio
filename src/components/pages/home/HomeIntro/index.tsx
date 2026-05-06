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

    // reduced-motion: dolly 演出なし、Hero は単純な 100vh セクションとして
    // 通常フローで配置 (Statement と縦並び)
    if (reducedMotion) {
        return (
            <section
                className="relative w-full h-screen bg-background overflow-hidden"
                onClickCapture={handleLinkClick}
                data-home-intro
            >
                <HeroSection
                    skipIntro={skipIntro}
                    updates={updates}
                    active={true}
                />
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
                <HeroSection
                    skipIntro={skipIntro}
                    updates={updates}
                    active={true}
                    dolly={progressMv}
                />
            </motion.section>
        </>
    );
};
