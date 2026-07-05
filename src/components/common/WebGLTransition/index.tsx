import React, { useEffect } from 'react';
import { navigate } from 'astro:transitions/client';
import { TRANSITION_EVENT, type PlayTransitionDetail } from './controller';

/**
 * 遷移コントローラ + クロスフェード制御。
 *
 * body 全体の opacity を変えるとヘッダー（position:fixed）も巻き込まれるため、
 * z-[98] の fixed オーバーレイを使ってフェードを表現する。
 * ヘッダーは z-[100] にあるためオーバーレイの影響を受けない。
 */

const FADE_DURATION = 180;
const OVERLAY_ID = 'page-fade-overlay';

function getOverlay(): HTMLDivElement {
    let el = document.getElementById(OVERLAY_ID) as HTMLDivElement | null;
    if (!el) {
        el = document.createElement('div');
        el.id = OVERLAY_ID;
        el.style.cssText =
            'position:fixed;inset:0;z-index:98;background:var(--color-background);pointer-events:none;opacity:0;';
        document.body.appendChild(el);
    }
    return el;
}

const fadeOut = (): Promise<void> =>
    new Promise<void>((resolve) => {
        const overlay = getOverlay();
        overlay.style.transition = `opacity ${FADE_DURATION}ms ease-out`;
        overlay.style.opacity = '1';
        window.setTimeout(resolve, FADE_DURATION);
    });

const fadeIn = (): void => {
    const overlay = getOverlay();
    overlay.style.transition = 'none';
    overlay.style.opacity = '1';
    requestAnimationFrame(() => {
        overlay.style.transition = `opacity ${FADE_DURATION}ms ease-in`;
        overlay.style.opacity = '0';
    });
};

export const WebGLTransition: React.FC = () => {
    useEffect(() => {
        // body に残った旧来の opacity スタイルをリセット
        document.body.style.opacity = '';
        document.body.style.transition = '';

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
            // DOMスワップ後は body の opacity が変わらないのでそのままフェードイン
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
