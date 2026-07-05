import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Props {
    to: number;
    duration?: number; // ms
    formatter?: (n: number) => string;
    className?: string;
    /** in-view を待たず即時開始したい場合 true */
    startImmediately?: boolean;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export const CountUp: React.FC<Props> = ({
    to,
    duration = 1200,
    formatter = (n) => Math.round(n).toLocaleString(),
    className,
    startImmediately = false,
}) => {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, amount: 0.3 });
    const reduced = useReducedMotion();
    const [val, setVal] = useState(0);

    useEffect(() => {
        if (!startImmediately && !inView) return;
        if (reduced) {
            setVal(to);
            return;
        }
        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            setVal(easeOutCubic(t) * to);
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [inView, to, duration, reduced, startImmediately]);

    return (
        <span ref={ref} className={className} aria-label={formatter(to)}>
            {formatter(val)}
        </span>
    );
};
