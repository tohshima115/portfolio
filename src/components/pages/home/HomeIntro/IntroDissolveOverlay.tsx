import { useMemo } from 'react';

interface Props {
    /** 0..1 の進捗 */
    progress: number;
    reducedMotion: boolean;
}

const STRIP_COUNT = 18;

// 案 F: ホログラム剥離。
// progress 0 → 1 で:
//   - 赤 / 青の chromatic aberration オーバーレイが左右に開く
//   - 縦方向 18 本のストリップ (背景色) が下方向に滑り落ちて Hero を「剥がす」
//   - 上端 progress bar (accent) と中央上 HUD カウンタが現れる
// progress 1.0 で親が triggerHardCut を呼び、短い白フラッシュ → Statement。
//
// reducedMotion 環境では一切描画しない (親 HomeIntro が即時 phase 切替する)。

export const IntroDissolveOverlay: React.FC<Props> = ({
    progress,
    reducedMotion,
}) => {
    if (reducedMotion) return null;

    const armed = progress > 0.02;
    const pct = Math.min(100, Math.round(progress * 100));
    const easedShift = progress * progress * 36; // 二次曲線で後半急激
    const aberrationOpacity = Math.min(1, progress * 1.4);

    // strip ごとの ランダム化された drop 量と遅延 (mount 時に一度だけ計算)
    const strips = useMemo(() => {
        return Array.from({ length: STRIP_COUNT }).map((_, i) => {
            // 疑似乱数: i だけで決まる安定値
            const seed = (i * 37 + 13) % 100;
            const phaseOffset = (seed % 30) / 100; // 0..0.3
            const dropFactor = 0.55 + (seed % 50) / 100; // 0.55..1.05
            const widthJitter = 0.85 + ((seed * 7) % 30) / 100; // 0.85..1.15
            return { phaseOffset, dropFactor, widthJitter };
        });
    }, []);

    return (
        <div
            aria-hidden
            className="absolute inset-0 z-[6] pointer-events-none overflow-hidden"
            style={{
                opacity: armed ? 1 : 0,
                transition: 'opacity 200ms ease-out',
                willChange: 'opacity',
            }}
        >
            {/* === Chromatic aberration: 赤側 (左にずらす) === */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundColor: 'oklch(0.65 0.22 25)',
                    mixBlendMode: 'screen',
                    opacity: aberrationOpacity * 0.18,
                    transform: `translate3d(${-easedShift}px, 0, 0)`,
                    willChange: 'transform, opacity',
                }}
            />
            {/* === Chromatic aberration: 青側 (右にずらす) === */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundColor: 'oklch(0.55 0.22 240)',
                    mixBlendMode: 'screen',
                    opacity: aberrationOpacity * 0.18,
                    transform: `translate3d(${easedShift}px, 0, 0)`,
                    willChange: 'transform, opacity',
                }}
            />

            {/* === Vertical strips: 背景色のストリップが下に滑り落ちる === */}
            <div className="absolute inset-0">
                {strips.map((s, i) => {
                    const x = (i / STRIP_COUNT) * 100;
                    const w = (100 / STRIP_COUNT) * s.widthJitter;
                    // strip 開始 progress (個別 stagger): phaseOffset まで動かない
                    const localP = Math.max(0, (progress - s.phaseOffset) / (1 - s.phaseOffset));
                    const drop = localP * 110 * s.dropFactor; // vh
                    const opacity = Math.min(0.85, localP * 0.95);
                    return (
                        <div
                            key={i}
                            className="absolute top-0 h-full"
                            style={{
                                left: `${x}%`,
                                width: `${w}%`,
                                backgroundColor: 'var(--color-background)',
                                opacity,
                                transform: `translate3d(0, ${drop}vh, 0)`,
                                willChange: 'transform, opacity',
                                boxShadow:
                                    i % 3 === 0
                                        ? '0 0 8px oklch(0.82 0.18 85 / 0.25)'
                                        : undefined,
                            }}
                        />
                    );
                })}
            </div>

            {/* === ScanLine: progress で薄く乗る === */}
            <div
                className="absolute inset-0"
                style={{
                    opacity: progress * 0.12,
                    backgroundImage:
                        'repeating-linear-gradient(0deg, transparent 0 2px, var(--color-foreground) 2px 3px)',
                }}
            />

            {/* === Vignette: 進捗で四隅を暗くする === */}
            <div
                className="absolute inset-0"
                style={{
                    opacity: progress * 0.6,
                    background:
                        'radial-gradient(ellipse at center, transparent 35%, oklch(0.97 0.01 100) 100%)',
                }}
            />

            {/* === 上端 progress bar (accent) === */}
            <div
                className="absolute top-0 left-0 right-0 h-px bg-accent origin-left"
                style={{
                    transform: `scaleX(${progress})`,
                    willChange: 'transform',
                }}
            />

            {/* === 中央上 HUD カウンタ === */}
            <div
                className="absolute top-6 left-1/2 -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.4em] flex items-center gap-2"
                style={{
                    opacity: armed ? 1 : 0,
                    color: progress >= 1 ? 'var(--color-accent)' : 'var(--color-foreground)',
                }}
            >
                <span className="text-accent">[</span>
                <span>TRANSFER</span>
                <span className="tabular-nums w-[3ch] text-right">
                    {String(pct).padStart(2, '0')}
                </span>
                <span>%</span>
                <span className="text-accent">]</span>
            </div>

            {/* === 下端 readiness markers === */}
            <div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60"
                style={{ opacity: armed ? 1 : 0 }}
            >
                <span className={progress > 0.05 ? 'text-foreground' : ''}>SCROLL</span>
                <span className="text-muted-foreground/30">·</span>
                <span className={progress > 0.5 ? 'text-foreground' : ''}>HOLD</span>
                <span className="text-muted-foreground/30">·</span>
                <span className={progress >= 1 ? 'text-accent' : ''}>JUMP</span>
            </div>
        </div>
    );
};
