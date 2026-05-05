import { useEffect, useRef } from 'react';

// Hero フェーズで wheel / touch / key / scrollbar drag を蓄積し、
// 0..1 の progress を onProgress で吐き、1.0 到達で onComplete を呼ぶ。
//
// 旧 useFirstScrollTrigger (1 回入力即発火) を置き換え、
// 「scroll するほど Hero が破壊されていき、ある程度貯まると確定」
// という progressive な遷移フィードバックの土台。
//
// - SNAP_THRESHOLD_PX 蓄積で progress=1 確定
// - DECAY_MS 入力なしで蓄積を緩やかに 0 へ減衰
// - scrollbar drag (scroll イベント) は即時 1.0 に飛ばす
// - 上方向 wheel は無視 (Hero に「進む方向だけ」反応させる)
// - prefers-reduced-motion 環境では disabled を true にして親側で即時遷移する想定

const SNAP_THRESHOLD_PX = 480;
const DECAY_DELAY_MS = 600;
const DECAY_DURATION_MS = 320;
const KEY_STEP_PX = 180;

export interface IntroProgressOptions {
    onProgress: (p: number) => void;
    onComplete: () => void;
    disabled?: boolean;
}

export function useIntroProgress(opts: IntroProgressOptions): void {
    const optsRef = useRef(opts);
    optsRef.current = opts;

    const accumRef = useRef(0);
    const completedRef = useRef(false);
    const decayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const decayRafRef = useRef<number | null>(null);
    const disabled = opts.disabled ?? false;

    useEffect(() => {
        if (disabled) return;
        // re-enable: 蓄積と完了フラグをリセット
        completedRef.current = false;
        accumRef.current = 0;
        optsRef.current.onProgress(0);

        const cancelDecay = () => {
            if (decayTimerRef.current) {
                clearTimeout(decayTimerRef.current);
                decayTimerRef.current = null;
            }
            if (decayRafRef.current) {
                cancelAnimationFrame(decayRafRef.current);
                decayRafRef.current = null;
            }
        };

        const emit = () => {
            const p = Math.max(0, Math.min(1, accumRef.current / SNAP_THRESHOLD_PX));
            optsRef.current.onProgress(p);
            if (p >= 1 && !completedRef.current) {
                completedRef.current = true;
                cancelDecay();
                optsRef.current.onComplete();
            }
        };

        const scheduleDecay = () => {
            cancelDecay();
            decayTimerRef.current = setTimeout(() => {
                if (completedRef.current) return;
                const start = performance.now();
                const initial = accumRef.current;
                const tick = (now: number) => {
                    if (completedRef.current) return;
                    const t = Math.min(1, (now - start) / DECAY_DURATION_MS);
                    accumRef.current = initial * (1 - t);
                    emit();
                    if (t < 1) {
                        decayRafRef.current = requestAnimationFrame(tick);
                    } else {
                        decayRafRef.current = null;
                    }
                };
                decayRafRef.current = requestAnimationFrame(tick);
            }, DECAY_DELAY_MS);
        };

        const addDelta = (dy: number) => {
            if (completedRef.current) return;
            accumRef.current = Math.max(0, accumRef.current + dy);
            emit();
            if (!completedRef.current) scheduleDecay();
        };

        const onWheel = (e: WheelEvent) => {
            // intro 中は wheel 全部捕食 (背景スクロール不可)
            e.preventDefault();
            if (e.deltaY > 0) addDelta(e.deltaY);
        };

        let lastTouchY: number | null = null;
        const onTouchStart = (e: TouchEvent) => {
            lastTouchY = e.touches[0]?.clientY ?? null;
        };
        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            if (lastTouchY === null) return;
            const y = e.touches[0]?.clientY ?? lastTouchY;
            const dy = (lastTouchY - y) * 2; // 指 1px ≒ wheel 2px
            lastTouchY = y;
            if (dy > 0) addDelta(dy);
        };
        const onTouchEnd = () => {
            lastTouchY = null;
        };

        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement | null)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (
                e.key === 'ArrowDown' ||
                e.key === 'PageDown' ||
                e.key === ' ' ||
                e.key === 'Enter'
            ) {
                e.preventDefault();
                addDelta(KEY_STEP_PX);
            }
        };

        // scrollbar drag だけ wheel/touch では捕食できない → scroll event で完了に飛ばす
        const onScroll = () => {
            if (completedRef.current) return;
            if (window.scrollY > 4) {
                accumRef.current = SNAP_THRESHOLD_PX;
                emit();
            }
        };

        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd, { passive: true });
        window.addEventListener('keydown', onKey);
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', onScroll);
            cancelDecay();
        };
    }, [disabled]);
}
