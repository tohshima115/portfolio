import { useEffect, useState } from 'react';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import type { UpdateItem } from '../HomeScene/types';
import { LogoIntroOverlay } from './LogoIntroOverlay';
import { HeroSection } from './HeroSection';

export type { UpdateItem };

// HomeIntro: ロゴスプラッシュ (初回訪問のみ) + Hero (通常フロー、以降は
// HomeStack が自然スクロールで続く) の 2 段構成。
// 以前の「fixed Hero + scroll spacer による dolly 演出」は撤去済み。

const readSkipIntroFlag = (): boolean => {
    if (typeof window === 'undefined') return false;
    return Boolean(
        (window as unknown as { __prtsSkipIntro?: boolean }).__prtsSkipIntro,
    );
};

// #hero-boot-overlay (index.astro が SSR HTML に置く BOOT_SEQUENCE) を消すまでの待ち時間。
// HomeIntro は client:only なので、hydrate 完了までの一瞬 HomeStack が覗くのを覆う目的。
const BOOT_MIN_VISIBLE_MS = 300;
const BOOT_FADE_DURATION_MS = 250;
const BOOT_MIN_VISIBLE_SKIP_MS = 150;
const BOOT_FADE_DURATION_SKIP_MS = 120;

export const HomeIntro = ({ updates: _updates = [] }: { updates?: UpdateItem[] }) => {
    const [skipIntro] = useState<boolean>(readSkipIntroFlag);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [bootDone, setBootDone] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
        return false;
    });

    useEffect(() => {
        const overlay = document.getElementById('hero-boot-overlay');
        if (bootDone) {
            if (overlay) overlay.style.display = 'none';
            return;
        }
        const minVisible = skipIntro ? BOOT_MIN_VISIBLE_SKIP_MS : BOOT_MIN_VISIBLE_MS;
        const fadeDuration = skipIntro ? BOOT_FADE_DURATION_SKIP_MS : BOOT_FADE_DURATION_MS;
        const fadeTimer = window.setTimeout(() => {
            if (overlay) overlay.style.opacity = '0';
            const doneTimer = window.setTimeout(() => {
                if (overlay) overlay.style.display = 'none';
                setBootDone(true);
            }, fadeDuration);
            return () => window.clearTimeout(doneTimer);
        }, minVisible);
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

    const showLogoIntro = bootDone && !skipIntro && !reducedMotion;

    return (
        <section onClickCapture={handleLinkClick} data-home-intro>
            {showLogoIntro && <LogoIntroOverlay />}
            {bootDone && <HeroSection />}
        </section>
    );
};
