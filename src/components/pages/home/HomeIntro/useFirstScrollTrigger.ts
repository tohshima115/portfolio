import { useEffect, useRef } from 'react';

// Hero フェーズで「初回の下方向入力」を捕捉して onTrigger を 1 度だけ呼ぶ。
// 旧 useSnapInput の「6 セクション間で蓄積→閾値到達でジャンプ」は捨て、
// Hero → Statement への 1 回限りハードカット用に縮退した。
//
// intro 中は wheel/touchmove を preventDefault して捕食 (window スクロールしない)。
// disabled=true (= phase が 'intro' を抜けた) になったらリスナーを解除し、
// 以後は通常のネイティブ縦スクロールが流れる。

export interface FirstScrollTriggerOptions {
    onTrigger: () => void;
    disabled?: boolean;
}

const TRIGGER_THRESHOLD_PX = 12;

export function useFirstScrollTrigger(opts: FirstScrollTriggerOptions): void {
    const optsRef = useRef(opts);
    useEffect(() => {
        optsRef.current = opts;
    });

    const firedRef = useRef(false);

    useEffect(() => {
        const fire = () => {
            if (firedRef.current) return;
            if (optsRef.current.disabled) return;
            firedRef.current = true;
            optsRef.current.onTrigger();
        };

        const onWheel = (e: WheelEvent) => {
            if (optsRef.current.disabled) return;
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
            if (optsRef.current.disabled) return;
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
            if (optsRef.current.disabled) return;
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
    }, []);
}
