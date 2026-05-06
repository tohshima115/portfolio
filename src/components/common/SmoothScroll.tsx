import { useEffect } from 'react';
import Lenis from 'lenis';

// ページ全体に Lenis (smooth scroll) を当てるクライアント側コンポーネント。
//
// 設計:
//   - 自前 rAF で Lenis を駆動。後から gsap が読み込めたら gsap.ticker に
//     切替え (rAF を 1 本化、ScrollTrigger と同期)
//   - lenis.on('scroll', ScrollTrigger.update) で StatementSection 等の
//     pin/scrub と同期させる
//   - Hero フェーズ (document.body.dataset.homePhase が 'intro' / 'cover' /
//     'reveal') は lenis.stop() で停止: useIntroProgress が wheel/touch を
//     自前で捌くため干渉を避ける。'scroll' に切替わったら lenis.start()
//   - MutationObserver で homePhase の変化を監視 (HomeIntro 側のコードに
//     手を入れなくて済むよう疎結合にしておく)
//
// React 不要な vanilla なライブラリだが、Astro の client:load で React island
// として読み込ませるため React コンポーネントとして実装。DOM は描画しない。

export const SmoothScroll: React.FC = () => {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // reduced-motion: smooth scroll は無効
        const reducedMotion =
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        if (reducedMotion) return;

        const lenis = new Lenis({
            duration: 1.1,
            // expo-out: ピーク速度から滑らかに減速 (Lenis 公式の例と同じ)
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 1.5,
            // タッチデバイスはネイティブの慣性スクロールに任せる (iOS/Android で
            // syncTouch=true にすると逆に違和感が出やすい)
            syncTouch: false,
        });

        // Hero フェーズでは停止 (useIntroProgress と競合させない)
        const applyPhase = () => {
            const phase = document.body.dataset.homePhase;
            if (phase === 'intro' || phase === 'cover' || phase === 'reveal') {
                lenis.stop();
            } else {
                lenis.start();
            }
        };
        applyPhase();
        const observer = new MutationObserver(applyPhase);
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-home-phase'],
        });

        // 自前 rAF で Lenis を回す。gsap 統合が成功したらここを止めて
        // gsap.ticker に切替える。
        let rafId = requestAnimationFrame(function loop(time: number) {
            lenis.raf(time);
            rafId = requestAnimationFrame(loop);
        });

        // gsap ScrollTrigger との統合 (HomeStack の StatementSection が pin/scrub に
        // 使う)。useScrollScene と同じく dynamic import で gsap を遅延ロード。
        let gsapInstance: typeof import('gsap').default | null = null;
        let scrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger | null =
            null;
        let tickerFn: ((time: number) => void) | null = null;
        let unsubScroll: (() => void) | null = null;
        let cancelled = false;

        void (async () => {
            try {
                const [gsapMod, stMod] = await Promise.all([
                    import('gsap'),
                    import('gsap/ScrollTrigger'),
                ]);
                if (cancelled) return;
                gsapInstance =
                    gsapMod.default ??
                    (gsapMod as unknown as typeof import('gsap').default);
                scrollTrigger = stMod.ScrollTrigger;
                gsapInstance.registerPlugin(scrollTrigger);

                // 自前 rAF を止めて gsap.ticker に切替え
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = 0;
                }
                tickerFn = (time: number) => {
                    lenis.raf(time * 1000);
                };
                gsapInstance.ticker.add(tickerFn);
                // gsap のラグ補正は Lenis の easing と二重補間になるため切る
                gsapInstance.ticker.lagSmoothing(0);

                // Lenis の scroll イベントで ScrollTrigger.update() を呼ぶ
                const onScroll = () => {
                    scrollTrigger?.update();
                };
                lenis.on('scroll', onScroll);
                unsubScroll = () => lenis.off('scroll', onScroll);
            } catch (err) {
                if (import.meta.env.DEV) {
                    console.warn(
                        '[SmoothScroll] gsap 統合に失敗、自前 rAF で動作継続',
                        err,
                    );
                }
            }
        })();

        return () => {
            cancelled = true;
            observer.disconnect();
            if (rafId) cancelAnimationFrame(rafId);
            if (gsapInstance && tickerFn) gsapInstance.ticker.remove(tickerFn);
            unsubScroll?.();
            lenis.destroy();
        };
    }, []);

    return null;
};

export default SmoothScroll;
