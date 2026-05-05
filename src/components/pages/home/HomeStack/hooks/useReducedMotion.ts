import { useEffect, useState } from 'react';

// matchMedia('(prefers-reduced-motion: reduce)') を購読する共通フック。
// HomeStack 配下の primitive / visual / scene すべてが参照する。
export function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReduced(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);
    return reduced;
}
