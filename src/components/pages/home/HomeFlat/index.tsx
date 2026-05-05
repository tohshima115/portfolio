import React, { useCallback, useEffect, useRef, useState } from 'react';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import type { UpdateItem } from '../HomeScene/types';
import { HardCutOverlay, type CutPhase } from './HardCutOverlay';
import { HeroSection } from './HeroSection';
import { AIChatClipSection } from './AIChatClipSection';
import { PLDashboardSection } from './PLDashboardSection';
import { SweptSection } from './SweptSection';
import { AboutSection } from './AboutSection';
import { ContactCTASection } from './ContactCTASection';
import { SnapHud } from './SnapHud';
import { useSnapInput } from './useSnapInput';

export type { UpdateItem };

// Hero / AIChatClip / PL Dashboard / Swept / About / CTA の 6 セクション。
// 旧 HomeScene の「カメラが空間内を巡る」連続モーションをやめ、
// セクション間でハードカット (~240ms 白フラッシュ) で切り替える。
// コンテンツは旧構成と同じ。スクロール入力 (wheel/touch/key snap) は流用。

const SECTION_COUNT = 6;
const COVER_MS = 120;
const REVEAL_MS = 120;

const readSkipIntroFlag = (): boolean => {
    if (typeof window === 'undefined') return false;
    return Boolean(
        (window as unknown as { __prtsSkipIntro?: boolean }).__prtsSkipIntro,
    );
};

export const HomeFlat = ({ updates = [] }: { updates?: UpdateItem[] }) => {
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

    // 同一オリジンリンクは WebGL トランジションへ (旧 HomeScene と同一挙動)
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

    // sectionIndex   : スクロール入力で更新される論理位置 (SnapHud 表示用)
    // displayedIndex : 実際に DOM に出ているセクション (フラッシュ peak で切替)
    const [sectionIndex, setSectionIndex] = useState(0);
    const [displayedIndex, setDisplayedIndex] = useState(0);
    const [cutPhase, setCutPhase] = useState<CutPhase>('idle');
    const [gauge, setGauge] = useState(0);
    const sectionIndexRef = useRef(0);
    const phaseRef = useRef<CutPhase>('idle');
    const isAnimatingRef = useRef(false);

    const transitionTo = useCallback(
        (next: number) => {
            const clamped = Math.max(0, Math.min(SECTION_COUNT - 1, next));
            if (clamped === sectionIndexRef.current) {
                setGauge(0);
                return;
            }
            if (phaseRef.current !== 'idle') return;
            sectionIndexRef.current = clamped;
            setSectionIndex(clamped);
            setGauge(0);
            isAnimatingRef.current = true;

            if (reducedMotion) {
                setDisplayedIndex(clamped);
                isAnimatingRef.current = false;
                return;
            }

            phaseRef.current = 'cover';
            setCutPhase('cover');
            window.setTimeout(() => {
                setDisplayedIndex(clamped);
                phaseRef.current = 'reveal';
                setCutPhase('reveal');
                window.setTimeout(() => {
                    phaseRef.current = 'idle';
                    setCutPhase('idle');
                    isAnimatingRef.current = false;
                }, REVEAL_MS);
            }, COVER_MS);
        },
        [reducedMotion],
    );

    useSnapInput({
        count: SECTION_COUNT,
        isAnimatingRef,
        getCurrentIndex: () => sectionIndexRef.current,
        onTransition: transitionTo,
        onGaugeChange: setGauge,
    });

    return (
        <section
            className="relative w-full h-screen overflow-hidden bg-background"
            onClickCapture={handleLinkClick}
        >
            {/*
              Hero は常駐 (display: none で隠す)。
              ContourBackground は IntersectionObserver で inView を判定し、
              frameloop="demand" の rAF を inView=false で停止する。
              display:none で element box が消えると IO は inView=false を
              観測するため、Hero 非表示中は GPU ループが自動停止する。
            */}
            <div
                className="absolute inset-0"
                style={{ display: displayedIndex === 0 ? 'block' : 'none' }}
            >
                <HeroSection
                    skipIntro={skipIntro}
                    updates={updates}
                    active={displayedIndex === 0}
                />
            </div>

            {displayedIndex === 1 && <AIChatClipSection />}
            {displayedIndex === 2 && <PLDashboardSection />}
            {displayedIndex === 3 && <SweptSection />}
            {displayedIndex === 4 && <AboutSection />}
            {displayedIndex === 5 && <ContactCTASection />}

            <HardCutOverlay phase={cutPhase} reducedMotion={reducedMotion} />
            <SnapHud
                gauge={gauge}
                sectionIndex={sectionIndex}
                sectionCount={SECTION_COUNT}
                onJump={transitionTo}
            />
        </section>
    );
};
