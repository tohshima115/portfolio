// Hero 背景の「宇宙」部分 (グラデーション上部の暗い領域) に置く星々。
// HeroGradientBackground の radial-gradient は `at 50% 100%` (下端中央) を
// 中心にした扇状だが、星の回転軸はそれよりもう少し下 (画面外) に置く。
// 星は上下左右の狭い範囲に固めず、軸の周り 360° 全体に散らしてある。
// そうしないと剛体回転で全員が同じ角度範囲にいるため、90° も回ると全員
// まとめて画面外に出て「消える」瞬間ができてしまう。全周に分布させておけば
// 常にどこかの星が視界に入れ替わり立ち替わり残る。

interface Star {
    top: number; // % (100 を超える/0 未満も許容。回転で画面内に出入りする)
    left: number; // %
    size: number; // px
    opacity: number;
}

// 回転軸 (Hero 全体を 100% とした座標系)。100% が Hero 下端なので、
// 132% はそこからさらに下の画面外。
const PIVOT_X = 50;
const PIVOT_Y = 160;

const STAR_COUNT = 400;
const RADIUS_MIN = 45; // %
const RADIUS_MAX = 150; // %
const SIZE_MIN = 1; // px
const SIZE_MAX = 6; // px

// SSR/CSR で配置がズレないよう、Math.random ではなく固定シードの疑似乱数で
// モジュール読み込み時に 1 度だけ生成する (mulberry32)。
const createRng = (seed: number) => {
    let state = seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const generateStars = (): Star[] => {
    const rand = createRng(20260722);
    return Array.from({ length: STAR_COUNT }, () => {
        const angle = rand() * Math.PI * 2;
        const radius = RADIUS_MIN + rand() * (RADIUS_MAX - RADIUS_MIN);
        // 大半は小粒に寄せつつ、たまに一回り大きい粒も混ぜたいので
        // 3 乗で小さい側に偏らせた乱数を使う (稀に SIZE_MAX 近くまで届く)。
        const sizeBias = Math.pow(rand(), 3);
        return {
            top: PIVOT_Y - radius * Math.sin(angle),
            left: PIVOT_X + radius * Math.cos(angle),
            size: SIZE_MIN + sizeBias * (SIZE_MAX - SIZE_MIN),
            opacity: 0.3 + rand() * 0.5,
        };
    });
};

const STARS = generateStars();

export const HeroStarField = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            <div
                className="absolute inset-0 motion-safe:animate-[hero-star-spin_900s_linear_infinite]"
                style={{ transformOrigin: `${PIVOT_X}% ${PIVOT_Y}%` }}
            >
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
