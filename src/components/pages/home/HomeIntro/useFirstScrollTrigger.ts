import { useEffect, useRef } from 'react';

// Hero フェーズで「初回の下方向入力」を捕捉して onTrigger を 1 度だけ呼ぶ。
//
// 設計上のポイント:
// - intro 中は wheel/touchmove を preventDefault して捕食 (window スクロールしない)。
// - disabled=true (= phase が 'intro' を抜けた) の間はリスナー解除 → ネイティブ縦スクロール。
// - disabled が true → false に戻った場合 (Hero 復帰時) は firedRef を reset し、
//   再びリスナーを張って新しい初回入力で再発火できるようにする。

export interface FirstScrollTriggerOptions {
    onTrigger: () => void;
    disabled?: boolean;
}

const TRIGGER_THRESHOLD_PX = 12;

export function useFirstScrollTrigger(opts: FirstScrollTriggerOptions): void {
    const optsRef = useRef(opts);
    optsRef.current = opts;

    const firedRef = useRef(false);
    const disabled = opts.disabled ?? false;

    useEffect(() => {
        if (disabled) return;
        // disabled が解除されるたびに「未発火」状態に戻す
        firedRef.current = false;

        const fire = () => {
            if (firedRef.current) return;
            firedRef.current = true;
            optsRef.current.onTrigger();
        };

        const onWheel = (e: WheelEvent) => {
            // intro 中は wheel 全部捕食 (背景スクロールさせない)
            e.preventDefault();
            if (firedRef.current) return;
            if (e.deltaY > TRIGGER_THRESHOLD_PX) fire();
        };

        let lastTouchY: number | null = null;
        const onTouchStart = (e: TouchEvent) => {
            lastTouchY = e.touches[0]?.clientY ?? null;
        };
        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            if (firedRef.current) return;
            if (lastTouchY === null) return;
            const dy = lastTouchY - (e.touches[0]?.clientY ?? lastTouchY);
            if (dy > TRIGGER_THRESHOLD_PX) fire();
        };
        const onTouchEnd = () => {
            lastTouchY = null;
        };

        const onKey = (e: KeyboardEvent) => {
            if (firedRef.current) return;
            const tag = (e.target as HTMLElement | null)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (
                e.key === 'ArrowDown' ||
                e.key === 'PageDown' ||
                e.key === ' ' ||
                e.key === 'Enter'
            ) {
                e.preventDefault();
                fire();
            }
        };

        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd, { passive: true });
        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('keydown', onKey);
        };
    }, [disabled]);
}
