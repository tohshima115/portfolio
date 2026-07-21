import { useEffect, useRef, useState } from 'react';

// Hero 内、マウスカーソル周辺にランダムな位置・サイズの白枠矩形が、
// transition なしで「パッと出てパッと消える」演出。

interface RectItem {
    id: number;
    top: number;
    left: number;
    width: number;
    height: number;
}

const MAX_RECTS = 4;
const SPAWN_INTERVAL_MIN_MS = 110;
const SPAWN_INTERVAL_MAX_MS = 170;
const LIFETIME_MIN_MS = 500;
const LIFETIME_MAX_MS = 900;
const SHORT_SIDE_MIN = 10;
const SHORT_SIDE_MAX = 28;
// 長辺 / 短辺の比率のとりうる範囲 (1:1 に近いものから 1:4 の細長いものまで)
const ASPECT_RATIO_MIN = 1;
const ASPECT_RATIO_MAX = 4;
// マウス位置からのランダムなずれ幅 (px)
const MOUSE_OFFSET_RANGE = 120;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

// -range 〜 +range の一様分布ではなく、0 (=マウス直近) に寄せた分布のオフセット。
// 2乗することで発生確率を中心に偏らせつつ、稀に range いっぱいまで飛ばす。
const randomBiasedOffset = (range: number) => {
    const sign = Math.random() < 0.5 ? -1 : 1;
    return sign * Math.pow(Math.random(), 2) * range;
};

export const HeroGlitchFrames = () => {
    const [rects, setRects] = useState<RectItem[]>([]);
    const nextIdRef = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        ) {
            return;
        }

        const handlePointerMove = (e: PointerEvent) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };
        window.addEventListener('pointermove', handlePointerMove);

        let spawnTimer: number;

        const spawn = () => {
            setRects((prev) => {
                if (prev.length >= MAX_RECTS) return prev;

                const containerRect = containerRef.current?.getBoundingClientRect();
                if (!containerRect) return prev;

                const id = nextIdRef.current++;
                // 短辺の長さとアスペクト比 (長辺/短辺) をそれぞれランダムに決め、
                // 縦横どちらを長辺にするかもランダムにする。
                const shortSide = randomBetween(SHORT_SIDE_MIN, SHORT_SIDE_MAX);
                const longSide = shortSide * randomBetween(ASPECT_RATIO_MIN, ASPECT_RATIO_MAX);
                const isWide = Math.random() > 0.5;
                const width = isWide ? longSide : shortSide;
                const height = isWide ? shortSide : longSide;

                // マウス位置があればその周辺、なければ画面内ランダムにフォールバック
                // (タッチデバイスなど pointermove が発火しない場合)。
                const basePos = mouseRef.current ?? {
                    x: randomBetween(0, containerRect.width),
                    y: randomBetween(0, containerRect.height),
                };
                const left = Math.min(
                    Math.max(basePos.x + randomBiasedOffset(MOUSE_OFFSET_RANGE), 0),
                    containerRect.width,
                );
                const top = Math.min(
                    Math.max(basePos.y + randomBiasedOffset(MOUSE_OFFSET_RANGE), 0),
                    containerRect.height,
                );

                window.setTimeout(() => {
                    setRects((cur) => cur.filter((r) => r.id !== id));
                }, randomBetween(LIFETIME_MIN_MS, LIFETIME_MAX_MS));

                return [...prev, { id, top, left, width, height }];
            });

            spawnTimer = window.setTimeout(
                spawn,
                randomBetween(SPAWN_INTERVAL_MIN_MS, SPAWN_INTERVAL_MAX_MS),
            );
        };

        spawnTimer = window.setTimeout(spawn, randomBetween(SPAWN_INTERVAL_MIN_MS, SPAWN_INTERVAL_MAX_MS));
        return () => {
            window.clearTimeout(spawnTimer);
            window.removeEventListener('pointermove', handlePointerMove);
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            {rects.map((r) => (
                <div
                    key={r.id}
                    className="absolute"
                    style={{
                        top: r.top,
                        left: r.left,
                        width: r.width,
                        height: r.height,
                        transform: 'translate(-50%, -50%)',
                        border: '5px solid var(--color-background)',
                    }}
                />
            ))}
        </div>
    );
};
