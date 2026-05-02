import React, { useEffect } from 'react';
import { navigate } from 'astro:transitions/client';
import { TRANSITION_EVENT, type PlayTransitionDetail } from './controller';

/**
 * 遷移コントローラ + クロスフェード制御。
 *
 * - `playWebGLTransition({ url })` を受けて `navigate()` を呼ぶ
 * - ブラウザ非依存のフェードを Astro ライフサイクルフックで組む:
 *     astro:before-preparation で loader を async ラップして、fetch 前に
 *       body の opacity を 0 にフェード
 *     astro:after-swap で新ページの body opacity を 0 から 1 へフェード
 *   View Transitions API を持たない Firefox でも動く。
 */

const FADE_DURATION = 180;

const fadeOut = (): Promise<void> =>
    new Promise<void>((resolve) => {
        const body = document.body;
        body.style.transition = `opacity ${FADE_DURATION}ms ease-out`;
        body.style.opacity = '0';
        window.setTimeout(resolve, FADE_DURATION);
    });

const fadeIn = (): void => {
    const body = document.body;
    body.style.transition = 'none';
    body.style.opacity = '0';
    requestAnimationFrame(() => {
        body.style.transition = `opacity ${FADE_DURATION}ms ease-in`;
        body.style.opacity = '1';
    });
};

export const WebGLTransition: React.FC = () => {
    useEffect(() => {
        const handlePlay = (e: Event) => {
            const detail = (e as CustomEvent<PlayTransitionDetail>).detail;
            if (detail?.url) {
                void navigate(detail.url);
            }
        };

        const handleBeforePreparation = (e: Event) => {
            // Astro が "loader" プロパティを持つ CustomEvent を発火する。
            // 本来の fetch loader を fadeOut → 元の loader の順に呼ぶようラップ。
            const ev = e as Event & { loader?: () => Promise<void> };
            const original = ev.loader;
            if (typeof original === 'function') {
                ev.loader = async () => {
                    await fadeOut();
                    await original();
                };
            }
        };

        const handleAfterSwap = () => {
            fadeIn();
        };

        window.addEventListener(TRANSITION_EVENT, handlePlay);
        document.addEventListener('astro:before-preparation', handleBeforePreparation);
        document.addEventListener('astro:after-swap', handleAfterSwap);
        return () => {
            window.removeEventListener(TRANSITION_EVENT, handlePlay);
            document.removeEventListener('astro:before-preparation', handleBeforePreparation);
            document.removeEventListener('astro:after-swap', handleAfterSwap);
        };
    }, []);

    return null;
};

export default WebGLTransition;
