import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { transitionVertex, transitionFragment } from './shaders';

export interface TransitionSceneHandle {
    /** uCover を直接更新 (GSAP から触る用) */
    setCover: (v: number) => void;
    /** uReveal を直接更新 */
    setReveal: (v: number) => void;
    /** uniform の現在値を取得 (デバッグ用) */
    getProgress: () => { cover: number; reveal: number };
}

interface Props {
    /** 帯の色 (CSS 色文字列) */
    color?: string;
    /** GSAP から uniform を直接掴むための ref */
    handleRef?: React.MutableRefObject<TransitionSceneHandle | null>;
}

/**
 * フルスクリーン shader plane。
 * NDC 直書きで描画 (vertex shader 側でクリップ空間にそのまま渡す) ため、
 * カメラやアスペクト比に依存しない。
 */
export const TransitionScene: React.FC<Props> = ({ color = '#0a0a0a', handleRef }) => {
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);

    const uniforms = useMemo(
        () => ({
            uCover: { value: 0 },
            uReveal: { value: 0 },
            uColor: { value: new THREE.Color(color) },
        }),
        [color],
    );

    // ハンドル経由で外部 (GSAP) から uniform を更新する
    if (handleRef) {
        handleRef.current = {
            setCover: (v: number) => {
                uniforms.uCover.value = v;
            },
            setReveal: (v: number) => {
                uniforms.uReveal.value = v;
            },
            getProgress: () => ({
                cover: uniforms.uCover.value,
                reveal: uniforms.uReveal.value,
            }),
        };
    }

    // R3F のレンダーループで material 側へ反映
    useFrame(() => {
        const mat = materialRef.current;
        if (!mat) return;
        // uniforms オブジェクトと material.uniforms は同じ参照を共有しているので、
        // ここでの追加処理は不要。将来時間ベースの effect を入れる時の差し込み口。
    });

    return (
        <mesh frustumCulled={false}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                ref={materialRef}
                uniforms={uniforms}
                vertexShader={transitionVertex}
                fragmentShader={transitionFragment}
                transparent
                depthTest={false}
                depthWrite={false}
            />
        </mesh>
    );
};
