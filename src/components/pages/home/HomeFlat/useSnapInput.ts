import { useEffect, useRef } from 'react';

// 旧 HomeScene のスナップ入力ロジックを抽出。
// wheel / touch を蓄積し、SNAP_THRESHOLD に到達したら onTransition(next) を呼ぶ。
// 入力が ACCUM_DECAY_MS 止んだら蓄積をリセットしてゲージを 0 へ戻す。
// transition 中 (isAnimatingRef.current === true) は新しい入力を弾く。

const SNAP_THRESHOLD = 600;
const ACCUM_DECAY_MS = 700;

export interface SnapInputOptions {
    count: number;
    isAnimatingRef: React.MutableRefObject<boolean>;
    getCurrentIndex: () => number;
    onTransition: (next: number) => void;
    onGaugeChange: (gauge: number) => void;
}

export function useSnapInput(opts: SnapInputOptions): void {
    // opts は毎レンダ参照が変わるので ref に逃がし、useEffect の依存から外す。
    const optsRef = useRef(opts);
    useEffect(() => {
        optsRef.current = opts;
    });

    const accumRef = useRef(0);
    const decayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleDelta = (deltaY: number) => {
            const o = optsRef.current;
            if (o.isAnimatingRef.current) return;
            accumRef.current += deltaY;
            const idx = o.getCurrentIndex();
            // 端での過剰蓄積はクランプ
            if (idx === 0 && accumRef.current < 0) accumRef.current = 0;
            if (idx === o.count - 1 && accumRef.current > 0) accumRef.current = 0;

            // しきい値到達 → 次へ
            if (accumRef.current >= SNAP_THRESHOLD) {
                accumRef.current = 0;
                o.onGaugeChange(0);
                if (decayTimerRef.current) {
                    clearTimeout(decayTimerRef.current);
                    decayTimerRef.current = null;
                }
                o.onTransition(idx + 1);
                return;
            }
            if (accumRef.current <= -SNAP_THRESHOLD) {
                accumRef.current = 0;
                o.onGaugeChange(0);
                if (decayTimerRef.current) {
                    clearTimeout(decayTimerRef.current);
                    decayTimerRef.current = null;
                }
                o.onTransition(idx - 1);
                return;
            }

            o.onGaugeChange(
                Math.max(-1, Math.min(1, accumRef.current / SNAP_THRESHOLD)),
            );

            if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
            decayTimerRef.current = setTimeout(() => {
                accumRef.current = 0;
                optsRef.current.onGaugeChange(0);
            }, ACCUM_DECAY_MS);
        };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            handleDelta(e.deltaY);
        };
        let lastTouchY: number | null = null;
        const onTouchStart = (e: TouchEvent) => {
            lastTouchY = e.touches[0].clientY;
        };
        const onTouchMove = (e: TouchEvent) => {
            if (lastTouchY === null) return;
            const y = e.touches[0].clientY;
            const dy = (lastTouchY - y) * 2; // 指 1px ≒ ホイール 2px 換算
            lastTouchY = y;
            e.preventDefault();
            handleDelta(dy);
        };
        const onKey = (e: KeyboardEvent) => {
            // ヘッダーや CTA 内の入力欄からのキーは透過させたい
            const tag = (e.target as HTMLElement | null)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            const o = optsRef.current;
            if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
                e.preventDefault();
                o.onTransition(o.getCurrentIndex() + 1);
            } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                e.preventDefault();
                o.onTransition(o.getCurrentIndex() - 1);
            } else if (e.key === 'Home') {
                e.preventDefault();
                o.onTransition(0);
            } else if (e.key === 'End') {
                e.preventDefault();
                o.onTransition(o.count - 1);
            }
        };

        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('keydown', onKey);
            if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
        };
    }, []);
}
