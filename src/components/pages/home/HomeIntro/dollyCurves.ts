// Hero→Works の dolly+blur 遷移用 easing カーブ集約。
// HomeIntro / HeroSection / ContourBackground の 3 箇所から参照する。
//
// 設計:
//   scroll 開始の手応えを最優先に、ease-out (p^0.65) で curve を組む。
//   早期 (p=0.1, ≈ 120px scroll) で scale が 10% 縮むため、wheel 1 ノッチで
//   「カメラが引き始めた」ことが視認できる。後半は blur と opacity が乗って
//   「ピントが外れて薄れて消える」流れで Works に引き渡す。

/** 0..1 を ease-out 寄りに整形 (p^0.65)。
 *  scroll 開始直後 (p=0.05) でも 13.7% 進む → カメラ引きの手応えが即座に出る。 */
const dollyEase = (p: number): number => {
    const c = Math.max(0, Math.min(1, p));
    return Math.pow(c, 0.65);
};

/** scale: 1.0 → 0.55 (45% pull-back)。
 *  ease-out カーブで p=0.1 (≈120px scroll) 時点で 10% 縮みを実現し、
 *  scroll の手応えを即座に視認できるようにする。 */
export const dollyScale = (p: number): number => 1 - dollyEase(p) * 0.45;

/** blur (px): 0 → 14。閾値 0.4 から二乗で立ち上げ。
 *  scale の進行 (p=0.4 で約 30% 縮み) と同期して背景がボケ始める。 */
export const dollyBlurPx = (p: number): number => {
    if (p <= 0.4) return 0;
    const q = (p - 0.4) / 0.6;
    return q * q * 14;
};

/** opacity: 0.7 から薄め始め、progress 1.0 で完全消失。
 *  Hero が消える瞬間に Works への引き渡しが完了する。 */
export const dollyOpacity = (p: number): number => {
    if (p <= 0.7) return 1;
    return 1 - (p - 0.7) / 0.3;
};

/** 背景 (ContourBackground canvas) は前景より弱めの blur で GPU 負荷を抑える。 */
export const dollyBlurPxBg = (p: number): number => dollyBlurPx(p) * 0.6;

/** 前景 (HeroSection) 用 blur (px): 0 → 12。
 *
 *  立ち上がりを progress 0.7 (= opacity が下がり始めるポイント) に合わせる。
 *  filter:blur は CSS 仕様で grouping context を作って preserve-3d をフラット化
 *  するが、opacity も < 1 のときに同じく grouping を作るので、どのみち progress 0.7
 *  以降はフラット化される段階に入る。blur の立ち上がりを opacity 低下と同期させれば、
 *  フラット化が新たに目立つことなく「ピントが外れて薄れて消える」自然な表現になる。 */
export const dollyBlurPxFg = (p: number): number => {
    if (p <= 0.7) return 0;
    const q = (p - 0.7) / 0.3;
    return q * q * 12;
};
