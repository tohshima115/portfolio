import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Props {
    text: string;
    /** 文字単位の解決にかける時間 (ms) */
    duration?: number;
    /** 1 文字あたりの開始 stagger (ms) */
    perCharStagger?: number;
    /** scramble 中に使う文字プール */
    chars?: string;
    /** false なら最終文字列を即時表示 (in-view 制御は親で) */
    play?: boolean;
    className?: string;
}

const DEFAULT_CHARS = '0123456789ABCDEF<>/[]+-*';

const randomChar = (pool: string): string =>
    pool[Math.floor(Math.random() * pool.length)] ?? '';

// 自前 ScrambleText。GSAP の有料 ScrambleTextPlugin を使わずに同等の演出。
// Array.from(text) で grapheme 単位 (4byte 絵文字含む)、半角空白は scramble しない。
export const ScrambleText: React.FC<Props> = ({
    text,
    duration = 600,
    perCharStagger = 24,
    chars = DEFAULT_CHARS,
    play = true,
    className,
}) => {
    const reduced = useReducedMotion();
    const [display, setDisplay] = useState(text);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (reduced || !play) {
            setDisplay(text);
            return;
        }
        const target = Array.from(text);
        const start = performance.now();
        const totalDuration = duration + target.length * perCharStagger;
        const tick = (now: number) => {
            const elapsed = now - start;
            const out = target.map((ch, i) => {
                if (ch === ' ') return ' ';
                const charStart = i * perCharStagger;
                const charEnd = charStart + duration;
                if (elapsed >= charEnd) return ch;
                if (elapsed < charStart) return randomChar(chars);
                return randomChar(chars);
            });
            setDisplay(out.join(''));
            if (elapsed < totalDuration) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                setDisplay(text);
            }
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [text, play, reduced, duration, perCharStagger, chars]);

    return (
        <span className={className} aria-label={text}>
            <span aria-hidden="true">{display}</span>
        </span>
    );
};
