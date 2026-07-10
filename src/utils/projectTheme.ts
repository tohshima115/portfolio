/**
 * プロジェクトごとのブランド色相 → Works ハブのドーム型グラデーション。
 * TOP ファーストビューの HeroGradientBackground と同じ 6 段構成
 * (0% は --color-background に収束させて継ぎ目を作らない) を、
 * oklch の L/C ラダーに一般化して色相だけ差し替える。
 *
 * hue はロゴの実色から採っている:
 *   swept                     #00a0c1 (シアン)
 *   kodaira-walking-gomihiroi #d9531e (落葉のオレンジ)
 *   kodaira-tsunagari-fes     #9f1239 (ローズ)
 *   foclock                サイトブランドと同じ緑
 *   aichatclip             ロゴが墨色なので低彩度のグラファイト
 */

export interface ProjectTheme {
    hue: number;
    /** 彩度スケール。1 = TOP の緑と同等。墨ロゴ等は下げる */
    chroma: number;
}

const THEMES: Record<string, ProjectTheme> = {
    aichatclip: { hue: 100, chroma: 0.12 },
    foclock: { hue: 140, chroma: 1 },
    swept: { hue: 215, chroma: 0.9 },
    'kodaira-walking-gomihiroi': { hue: 50, chroma: 0.95 },
    'kodaira-tsunagari-fes': { hue: 15, chroma: 0.85 },
};

const DEFAULT_THEME: ProjectTheme = { hue: 135, chroma: 1 };

export const getProjectTheme = (slug: string): ProjectTheme =>
    THEMES[slug] ?? DEFAULT_THEME;

/**
 * ドームグラデーションの色停止点 (内側 → 外側)。
 * TOP の #e3f1d8 / #7fc95d / #2c7a3c / #081b0f / #020603 を
 * oklch 近似したラダー。
 */
export const domeStops = ({ hue, chroma }: ProjectTheme): string[] => {
    const c = (base: number) => (base * chroma).toFixed(3);
    return [
        `oklch(0.94 ${c(0.05)} ${hue})`,
        `oklch(0.76 ${c(0.16)} ${hue})`,
        `oklch(0.50 ${c(0.11)} ${hue})`,
        `oklch(0.22 ${c(0.04)} ${hue})`,
        `oklch(0.15 ${c(0.015)} ${hue})`,
    ];
};

/** ハブ以外 (章カードのプレースホルダー等) で使う淡い面の色 */
export const tintSurface = ({ hue, chroma }: ProjectTheme): string =>
    `oklch(0.94 ${(0.045 * chroma).toFixed(3)} ${hue})`;

/** テキストやボーダーに使える濃い側のブランド色 */
export const tintInk = ({ hue, chroma }: ProjectTheme): string =>
    `oklch(0.45 ${(0.11 * chroma).toFixed(3)} ${hue})`;
