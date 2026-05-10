// WORKS pin carousel の幾何 / アニメ params / timeline label を集約。
// 微調整時はここだけを触ればよい。

// ───────────────────────────────────────────────────────────
// Folder grid geometry
// 横 8 × 縦 5 = 40 stack。中段は 3 行 (row 1..3)。
// ───────────────────────────────────────────────────────────
export const FOLDER_COLS = 8;
export const FOLDER_ROWS = 5;
export const TILE_W_VW = 13; // 13 × 8 = 104vw
export const TILE_H_VH = 21;

// 中段 (row 1..N-2 間) は ROW_COMPRESSED_STRIDE で詰める。
// LAYER_SCALE_Y × TILE_H 未満にすれば overlap が発生 = ユーザ指定の「マイナス間隔」。
export const ROW_COMPRESSED_STRIDE_VH = 14;

// 端行 (row 0 → row 1, row N-2 → row N-1) は edgeStride = TILE_H + EDGE_GAP_EXTRA
// 中段 stride=14 と組み合わせて 99vh 内に収める: 25*2 + 14*2 + 21 = 99vh
export const EDGE_GAP_EXTRA_VH = 4;

// 1 stack = 4 layer の folder を radial offset で重ねる。
// front (大きい layer index) → 中心に寄る、back → 外側。
export const STACK_LAYERS = 4;
export const STACK_OFFSET_X_PX = 18;
export const STACK_OFFSET_Y_PX = 11;

// 各 layer の folder size 比 (TILE 比)。
// 横はやや narrow にして stack 間に visible gap、縦は中段の余白確保。
export const LAYER_SCALE_X = 0.82;
export const LAYER_SCALE_Y = 0.84;

// ───────────────────────────────────────────────────────────
// Phase D — partial collapse
// シフト後の右端 3 列 (pre-shift col 4/5/6) を半潰れで止める。
// progress 1.0 → (scaleX 0.5 / scaleY 0) = 完全潰し
// progress 0.0 → (scaleX 1.0 / scaleY 1.0) = 未着手
// ───────────────────────────────────────────────────────────
export const PARTIAL_BASE: Record<number, number> = {
    4: 0.70,
    5: 0.45,
    6: 0.20,
};
// 同列内で row が下がるごとに進捗を減衰
export const ROW_PROGRESS_FALLOFF = 0.10;
// row 1 (中段の最上段) のみ +bonus で上行ほど明確に進んだ波に見せる
export const ROW_TOP_BONUS = 0.10;

// 中段 mid shrink の per-tile stagger (data-mid-delay の係数)
export const MID_DELAY_COL_STAGGER = 0.15;
export const MID_DELAY_ROW_STAGGER = 0.04;

// ───────────────────────────────────────────────────────────
// Pin & section dimensions
// ───────────────────────────────────────────────────────────
export const PIN_SCROLL_END = '+=700%';
export const SECTION_MIN_HEIGHT_VH = 800;

// ───────────────────────────────────────────────────────────
// Timeline labels
// scrub timeline は 0..(max tween end) を pin scroll 0..1 にマップする。
// 数値は normalized timeline 上の絶対位置。
// ───────────────────────────────────────────────────────────
export const TIMING = {
    // Phase A: Cloudflare hero reveal (~0.05–0.30)
    heroGlobe: 0.05,
    heroSubLabel: 0.10,
    heroHeadline: 0.13,
    heroStatsBadge: 0.20,
    heroStats: 0.23,
    heroStatsCount: 0.30,

    // Phase B: folder waterfall (~0.30–0.62)
    folderWaterfallStart: 0.30,
    folderWaterfallSpread: 0.20,
    folderWaterfallDuration: 0.12,

    // Phase D: shift + shrink + hero fade (~0.66–0.86)
    folderShiftStart: 0.66,
    folderShiftDuration: 0.22,
    midShrinkStart: 0.66,
    midShrinkDuration: 0.11,
    heroFadeStart: 0.66,
    heroFadeDuration: 0.22,

    // Phase E: WORKS heading reveal (~0.78–1.10)
    worksRule: 0.78,
    worksSubLabel: 0.78,
    worksHeading: 0.82,
    worksHeadingDuration: 0.18,
    worksHeadingStagger: 0.025,
    worksMeta: 0.90,

    // Phase F: project transitions (~1.30–2.60)
    // 各 transition は前 stage を fade out (outAt 起点) → 次 stage を fade in (inAt 起点)
    projectTransitions: [
        { id: '01', outAt: 1.30, inAt: 1.36 },
        { id: '02', outAt: 1.80, inAt: 1.86 },
        { id: '03', outAt: 2.30, inAt: 2.36 },
    ],
    projectOutDuration: 0.10,
    projectInDuration: 0.14,
    projectRuleDuration: 0.10,
} as const;
