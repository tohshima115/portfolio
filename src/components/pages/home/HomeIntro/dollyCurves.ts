// Hero→Statement の dolly+blur 遷移用 easing カーブ集約。
// HomeIntro / HeroSection / ContourBackground の 3 箇所から参照する。
//
// 閾値 0.55 (blur) / 0.65 (scale boost) / 0.7 (opacity) を意図的にずらして、
// 「先にカメラが引き始める → ピントが外れる → 像が薄くなる」という段階感を作る。

// 後半急峻ブースト: 0..0.65 は線形で subtle、0.65..1.0 は ease-in 二乗で急登。
const lateBoost = (p: number): number => {
    if (p <= 0.65) return p * 0.35;
    const q = (p - 0.65) / 0.35;
    return 0.227 + q * q * 0.773;
};

/** scale: 1.0 → 0.70 (30% pull-back) */
export const dollyScale = (p: number): number => 1 - lateBoost(p) * 0.3;

/** blur (px): 0 → 14。閾値 0.55 から二乗で立ち上げ。 */
export const dollyBlurPx = (p: number): number => {
    if (p <= 0.55) return 0;
    const q = (p - 0.55) / 0.45;
    return q * q * 14;
};

/** opacity: 0.7 から薄め始め、progress 1.0 で完全消失。
 *  sticky pin から外れる瞬間に Hero が消えていることで、Statement との
 *  境界が綺麗に切替わる。 */
export const dollyOpacity = (p: number): number => {
    if (p <= 0.7) return 1;
    return 1 - (p - 0.7) / 0.3;
};

/** 背景 (ContourBackground canvas) は前景より弱めの blur で GPU 負荷を抑える。 */
export const dollyBlurPxBg = (p: number): number => dollyBlurPx(p) * 0.6;
