import React, { useEffect } from 'react';
import { navigate } from 'astro:transitions/client';
import { TRANSITION_EVENT, type PlayTransitionDetail } from './controller';

/**
 * 遷移コントローラ。
 *
 * 視覚的なクロスフェードは Astro ClientRouter の View Transitions API +
 * `::view-transition-old(root)` / `::view-transition-new(root)` の CSS
 * (global.css 参照) に委譲。このコンポーネント自体は DOM を持たず、
 * `playWebGLTransition({ url })` を受けて `navigate()` を呼ぶだけ。
 */
export const WebGLTransition: React.FC = () => {
    useEffect(() => {
        const handlePlay = (e: Event) => {
            const detail = (e as CustomEvent<PlayTransitionDetail>).detail;
            if (detail?.url) {
                void navigate(detail.url);
            }
        };
        window.addEventListener(TRANSITION_EVENT, handlePlay);
        return () => window.removeEventListener(TRANSITION_EVENT, handlePlay);
    }, []);

    return null;
};

export default WebGLTransition;
