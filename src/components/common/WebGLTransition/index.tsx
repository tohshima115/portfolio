import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { animate, type AnimationPlaybackControls } from 'framer-motion';
import { navigate } from 'astro:transitions/client';
import { TransitionScene, type TransitionSceneHandle } from './TransitionScene';
import { TRANSITION_EVENT, type PlayTransitionDetail } from './controller';

/**
 * WebGLTransition オーバーレイ
 *
 * - `transition:persist` で root に置き、ナビゲーション間で生存させる前提
 * - `playWebGLTransition({ url })` の発火を購読
 * - cover フェーズ完了後に Astro の navigate() を呼び、afterSwap で reveal フェーズへ
 *
 * ※ 現状は仮の vertical wipe。表現は後から差し替える予定。
 */
export const WebGLTransition: React.FC = () => {
    const handleRef = useRef<TransitionSceneHandle | null>(null);
    const animRef = useRef<AnimationPlaybackControls | null>(null);
    const tokenRef = useRef(0);
    const [active, setActive] = useState(false);

    useEffect(() => {
        const handlePlay = async (e: Event) => {
            const detail = (e as CustomEvent<PlayTransitionDetail>).detail || ({ url: null } as PlayTransitionDetail);
            const coverDuration = detail.coverDuration ?? 0.6;
            const revealDuration = detail.revealDuration ?? 0.6;

            // 進行中の遷移があれば中断
            const token = ++tokenRef.current;
            animRef.current?.stop();

            const handle = handleRef.current;
            if (!handle) return;

            setActive(true);
            handle.setCover(0);
            handle.setReveal(0);

            // Cover phase: 黒帯が降りてきて画面を覆う
            const coverAnim = animate(0, 1, {
                duration: coverDuration,
                ease: 'easeInOut',
                onUpdate: (v) => handle.setCover(v),
            });
            animRef.current = coverAnim;
            try { await coverAnim; } catch { /* stopped */ }
            if (token !== tokenRef.current) return;

            // 完了直後に navigate (Astro ClientRouter)
            if (detail.url) void navigate(detail.url);

            // Reveal phase: 軽くディレイを挟んでから黒帯を引き上げ
            const revealAnim = animate(0, 1, {
                duration: revealDuration,
                delay: 0.05,
                ease: 'easeInOut',
                onUpdate: (v) => handle.setReveal(v),
            });
            animRef.current = revealAnim;
            try { await revealAnim; } catch { /* stopped */ }
            if (token !== tokenRef.current) return;

            setActive(false);
        };

        window.addEventListener(TRANSITION_EVENT, handlePlay);
        return () => {
            window.removeEventListener(TRANSITION_EVENT, handlePlay);
            animRef.current?.stop();
        };
    }, []);

    return (
        <div
            className="fixed inset-0 pointer-events-none"
            style={{
                zIndex: 9999,
                // 非アクティブ時はそもそも合成対象から外し、GPU 負荷をゼロに。
                visibility: active ? 'visible' : 'hidden',
            }}
            aria-hidden="true"
        >
            <Canvas
                orthographic
                gl={{ alpha: true, antialias: false, premultipliedAlpha: false }}
                style={{ width: '100%', height: '100%' }}
                dpr={[1, 2]}
            >
                <TransitionScene handleRef={handleRef} />
            </Canvas>
        </div>
    );
};

export default WebGLTransition;
