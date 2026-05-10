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

// 左外に予備として持つ hidden col の数。
// Phase D の右シフト (1 回) + Phase F の各 project transition での右シフト (3 回)
// 合計 4 回シフトする間に左から新しい列が滑り込めるよう、4 列ぶん左に余分を確保。
export const HIDDEN_LEFT_COLS = 4;

// 中段 (row 1..N-2 間) は ROW_COMPRESSED_STRIDE で詰める。
// LAYER_SCALE_Y × TILE_H 未満にすれば overlap が発生 = ユーザ指定の「マイナス間隔」。
export const ROW_COMPRESSED_STRIDE_VH = 14;

// 端行 (row 0 → row 1, row N-2 → row N-1) は edgeStride = TILE_H + EDGE_GAP_EXTRA
// 中段 stride=14 と組み合わせて 99vh 内に収める: 25*2 + 14*2 + 21 = 99vh
export const EDGE_GAP_EXTRA_VH = 4;

// ───────────────────────────────────────────────────────────
// No-folder band — top row の下端 ↔ bottom row の上端 で囲まれる中央帯。
// 中段 row tile はこの band 内に存在するが、Phase D 以降 wave 外は collapse されるので
// 視覚的にはほぼ空。WORKS / project stage はこの band を親枠として描画する。
// ───────────────────────────────────────────────────────────
const _edgeStrideVh = TILE_H_VH + EDGE_GAP_EXTRA_VH;
export const NO_FOLDER_BAND_TOP_VH = TILE_H_VH; // 21vh (= top row の下端)
export const NO_FOLDER_BAND_BOTTOM_VH =
    _edgeStrideVh * 2 + (FOLDER_ROWS - 3) * ROW_COMPRESSED_STRIDE_VH; // 78vh (= bottom row の上端)
export const NO_FOLDER_BAND_HEIGHT_VH =
    NO_FOLDER_BAND_BOTTOM_VH - NO_FOLDER_BAND_TOP_VH; // 57vh

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
// Mid shrink wave — 右シフトに合わせて 1 列ずつ左へ波が移動する。
// progress 1.0 → (scaleX 0.5 / scaleY 0) = 完全潰し
// progress 0.0 → (scaleX 1.0 / scaleY 1.0) = 縮小なし、フル可視
//
// 初期 wave は cols 4/5/6。各 project transition で wave 全体が 1 列ずつ
// 左にスライド: F1=[3,4,5], F2=[2,3,4], F3=[1,2,3]。
// 各 col が wave 外になった時の挙動:
//   - wave より左 (まだ入ってない / これから入る) → 1.0 (mid 不可視)
//   - wave より右 (すでに通過 / 画面外へ押し出される) → 0 (縮小なし)
// ───────────────────────────────────────────────────────────
export const INITIAL_WAVE_COLS = [4, 5, 6];

// wave 内の [position][row index 0..2 = 中段 row 1..3] 別 progress。
//   position 0 = 3 列目 (= wave 左端、画面で言うと右から 3 列目): 中程度の partial collapse、
//                上下を中央 row に寄せた緩やかな row 変動
//   position 1 = 2 列目: 上に行くほど少しだけ縮小、row 3 はゼロ (= 階段)
//   position 2 = 1 列目 (= 右端): 全 row 縮小なし
export const WAVE_PROGRESS_GRID: number[][] = [
    [0.70, 0.60, 0.55], // pos 0 — 中央 row を基準に上下が寄った緩やかな波
    [0.10, 0.05, 0],    // pos 1 — 階段状の薄い縮小
    [0, 0, 0],          // pos 2 — 縮小なし
];

// settle 後、partial collapse 状態の row がスクロールで progress 減 (= tile 大きく) する量。
// drift target = max(0, progress - WAVE_GROWBACK)。
export const WAVE_GROWBACK = 0.20;

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

    // 右シフト (folderShiftDuration=0.22, power4.inOut) の主要動作は中盤で発生する。
    // mid wave の settle (=0.11, power3.out) の主要動作 (前半 30%) を中盤に揃えるため、
    // settle 開始を outAt から +offset 遅らせて「シフト中盤で wave がスライドする」見た目に。
    shiftSettleOffset: 0.06,

    // F3 settle 後の drift 終端。pin 終端より少し手前で止まる。
    // (timeline 全体は 0..2.70 を pin 0..1 に scrub)
    timelineEnd: 2.70,
} as const;
