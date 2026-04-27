import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { gsap } from 'gsap';
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
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const [active, setActive] = useState(false);

    useEffect(() => {
        const handlePlay = (e: Event) => {
            const detail = (e as CustomEvent<PlayTransitionDetail>).detail || ({ url: null } as PlayTransitionDetail);
            const coverDuration = detail.coverDuration ?? 0.6;
            const revealDuration = detail.revealDuration ?? 0.6;

            // 進行中の遷移があれば破棄
            tlRef.current?.kill();

            const handle = handleRef.current;
            if (!handle) return;

            setActive(true);
            handle.setCover(0);
            handle.setReveal(0);

            const proxy = { cover: 0, reveal: 0 };

            const tl = gsap.timeline({
                onComplete: () => {
                    setActive(false);
                },
            });

            // Cover phase: 黒帯が降りてきて画面を覆う
            tl.to(proxy, {
                cover: 1,
                duration: coverDuration,
                ease: 'power2.inOut',
                onUpdate: () => handle.setCover(proxy.cover),
            });

            // 完了直後に navigate (Astro ClientRouter)
            tl.add(() => {
                if (detail.url) {
                    void navigate(detail.url);
                }
            });

            // navigate の完了を待たずに、astro:after-swap で reveal を始めたい。
            // が、ここでは単純化のため少し遅延させて reveal を流す。
            // 後でイベント連動に作り変える。
            tl.to(
                proxy,
                {
                    reveal: 1,
                    duration: revealDuration,
                    ease: 'power2.inOut',
                    onUpdate: () => handle.setReveal(proxy.reveal),
                },
                `+=0.05`,
            );

            tlRef.current = tl;
        };

        window.addEventListener(TRANSITION_EVENT, handlePlay);
        return () => {
            window.removeEventListener(TRANSITION_EVENT, handlePlay);
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
