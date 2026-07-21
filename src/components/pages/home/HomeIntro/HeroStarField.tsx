// Hero 背景の「宇宙」部分 (グラデーション上部の暗い領域) に置く星々。
// HeroGradientBackground の radial-gradient は `at 50% 100%` (下端中央) を
// 中心にした扇状なので、星の回転軸もそこに合わせる。全体を 1 枚のレイヤーとして
// ごくゆっくり回転させ、静止画に近い「気づいたら動いている」速度にする。

interface Star {
    top: number; // %
    left: number; // %
    size: number; // px
    opacity: number;
}

// 配置は毎回ランダムだと SSR/CSR でズレるため固定値。
// 「空」寄りの下 30% 程を避け、上〜中央の暗い領域に散らす。
const STARS: Star[] = [
    { top: 6, left: 18, size: 1.5, opacity: 0.5 },
    { top: 10, left: 62, size: 2, opacity: 0.7 },
    { top: 14, left: 84, size: 1, opacity: 0.4 },
    { top: 18, left: 34, size: 1.5, opacity: 0.6 },
    { top: 22, left: 8, size: 1, opacity: 0.35 },
    { top: 24, left: 71, size: 1.5, opacity: 0.5 },
    { top: 28, left: 46, size: 2, opacity: 0.8 },
    { top: 30, left: 92, size: 1, opacity: 0.4 },
    { top: 33, left: 15, size: 1, opacity: 0.45 },
    { top: 36, left: 58, size: 1.5, opacity: 0.55 },
    { top: 38, left: 27, size: 1, opacity: 0.35 },
    { top: 41, left: 79, size: 1.5, opacity: 0.6 },
    { top: 44, left: 5, size: 1, opacity: 0.4 },
    { top: 46, left: 65, size: 1, opacity: 0.4 },
    { top: 12, left: 47, size: 1, opacity: 0.4 },
    { top: 20, left: 55, size: 1, opacity: 0.35 },
];

export const HeroStarField = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            <div className="absolute inset-0 motion-safe:animate-[hero-star-spin_240s_linear_infinite] [transform-origin:50%_100%]">
                {STARS.map((s, i) => (
                    <span
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            top: `${s.top}%`,
                            left: `${s.left}%`,
                            width: s.size,
                            height: s.size,
                            backgroundColor: 'var(--color-hero-gradient-2)',
                            opacity: s.opacity,
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
