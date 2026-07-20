import { useEffect, useState } from 'react';
import { playWebGLTransition } from '@/components/common/WebGLTransition/controller';
import { LogoIntroOverlay } from './LogoIntroOverlay';
import { HeroSection } from './HeroSection';

// HomeIntro: ロゴスプラッシュ (初回訪問のみ) + Hero (通常フロー、以降は
// HomeStack が自然スクロールで続く) の 2 段構成。
// 以前の「fixed Hero + scroll spacer による dolly 演出」は撤去済み。

const readSkipIntroFlag = (): boolean => {
    if (typeof window === 'undefined') return false;
    return Boolean(
        (window as unknown as { __prtsSkipIntro?: boolean }).__prtsSkipIntro,
    );
};

// #hero-boot-overlay (index.astro が SSR HTML に置く無地の覆い) を消すまでの待ち時間。
// スプラッシュを出さないケース (2 回目以降 / reduced motion) でのみ使う。
const BOOT_MIN_VISIBLE_MS = 150;
const BOOT_FADE_DURATION_MS = 120;

export const HomeIntro = () => {
    // スプラッシュを出すかどうかは mount 時点で確定させる。
    // ここを「boot overlay が消えてから」にすると、一度サイトが見えた後に
    // 白い面が被さってロゴが始まる = 演出がサイト表示より後に見える、という
    // 順序の破綻が起きる (実際に起きていた)。
    const [showLogoIntro] = useState<boolean>(
        () => !readSkipIntroFlag() &&
            (typeof window === 'undefined' ||
                !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),
    );

    useEffect(() => {
        const overlay = document.getElementById('hero-boot-overlay');
        if (!overlay) return;

        // スプラッシュを出す場合、この時点で LogoIntroOverlay が同じ地色で
        // 全面を覆っている。boot overlay はもう用済みなのでフェードさせず
        // 即座に消す (フェードするとその間サイトが透けてしまう)。
        if (showLogoIntro) {
            overlay.style.display = 'none';
            return;
        }

        const fadeTimer = window.setTimeout(() => {
            overlay.style.opacity = '0';
            window.setTimeout(() => {
                overlay.style.display = 'none';
            }, BOOT_FADE_DURATION_MS);
        }, BOOT_MIN_VISIBLE_MS);
        return () => window.clearTimeout(fadeTimer);
    }, [showLogoIntro]);

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

    // HeroSection はスプラッシュの裏で常時マウントする。
    // HomeStack (WorksSection) の GSAP ScrollTrigger は mount 直後にレイアウトを
    // 計測するため、Hero の高さがここで確定していないと pin の start/end が
    // ズレて WorksSection が意図せず画面最上部に固定表示されてしまう。
    return (
        <section onClickCapture={handleLinkClick} data-home-intro>
            {showLogoIntro && <LogoIntroOverlay />}
            <HeroSection />
        </section>
    );
};
