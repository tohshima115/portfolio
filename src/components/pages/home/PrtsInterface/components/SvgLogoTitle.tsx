import { motion } from 'framer-motion';
import { MAIN_TITLE_TIMING_MS, msToS, DESKTOP_LOGO_TIMING, MOBILE_LOGO_TIMING, type LogoTimingProfile } from '../config/animationTiming';

/**
 * ロゴ + ロゴタイプを 1 つの SVG にまとめたコンポーネント。
 *
 * なぜ SVG 1 個に統合するか:
 *   ロゴアニメ中に親 (HeroSection outer / HeroLayer) が `transform-style: preserve-3d`
 *   + rotateX/rotateZ/scale で動いていると、DOM ベースの「多数の子要素が個別に
 *   animate する」構造は compositor 側で「各子要素を 3D 投影した bitmap を毎フレーム
 *   再生成」する必要が生じ、raster pipeline が間に合わずに明滅・引き伸ばし・想定外の
 *   形になる。等高線背景 (ContourBackground) は `<canvas>` 1 個で compositor から
 *   見れば「1 テクスチャ」なので親の 3D 変換と独立して合成され明滅しない。
 *   SVG も同じく replaced element として 1 テクスチャに扱われるため、内部で何が
 *   animate しようと外部の compositor からは「1 つの絵が動いている」ようにしか見えず、
 *   親 3D 変換とのラスタ競合が起きない。
 *
 * 演出は元の DOM 版 (MainTitle + ToyoshimaLogo) と同等:
 *   - 中央セルの blink (0/1 切替 ×4)
 *   - clip-path reveal (中央 → 外周への展開)
 *   - 上両端セルの塗りつぶし (scaleY 0→1, top origin)
 *   - 上中央セルからの drop down (height 0→full)
 *   - ロゴ全体の左方向スライド (logoMove)
 *   - タイトルテキストの slide-in + fade-in
 */

interface Props {
    skipIntro?: boolean;
    /** desktop: 9 cells 横にタイトル、mobile: 9 cells 上にタイトル */
    layout: 'desktop' | 'mobile';
}

// --- Desktop レイアウト定数 (DOM 版と一致) ---
const D_UNIT = 10;
const D_SIZE = D_UNIT * 5;        // cell 50
const D_GAP = D_UNIT * 3;         // 30
const D_BORDER = D_UNIT * 1;      // 10
const D_LOGO_CONTENT = D_SIZE * 3 + D_GAP * 2; // 210
const D_LOGO_PADDING = 32;        // p-4 (両側)
const D_LOGO_FULL = D_LOGO_CONTENT + D_LOGO_PADDING; // 242
const D_TITLE_GAP = 64;           // logo - title の間隔 (md:gap-16)
// タイトル文字盤の幅は SVG <text> で内部レンダリングするので実測しない。
// 余裕を持って固定 viewBox に収める。"TOYO"/"SHIMA" は 6rem 太字。
const D_TITLE_W = 360;            // タイトルテキスト領域の予約幅 (実値より大きめ)
const D_TITLE_H = D_LOGO_FULL;
// SVG 全体 viewBox: ロゴが左端、タイトルが右、その間に D_TITLE_GAP
const D_VB_W = D_LOGO_FULL + D_TITLE_GAP + D_TITLE_W;
const D_VB_H = D_LOGO_FULL;
// 「ロゴ + タイトル全体」の中心を SVG 中央に置きたいが、ロゴ単体時はロゴが SVG 中央。
// 元コンポーネントと同じ「mount 直後はロゴ中央、titleWidth 判明後にロゴが左へ slide」を
// SVG 内の logo group transform で再現。最終位置:
//   logoFinalX = -(D_TITLE_GAP + D_TITLE_W_effective) / 2
// titleFinalX は SVG 内部の絶対座標で配置するので不要 (タイトル group は固定位置)。

// --- Mobile レイアウト定数 ---
const M_UNIT = 6;
const M_SIZE = M_UNIT * 5;        // 30
const M_GAP = M_UNIT * 3;         // 18
const M_BORDER = M_UNIT * 1;      // 6
const M_LOGO_CONTENT = M_SIZE * 3 + M_GAP * 2; // 126
const M_LOGO_PADDING = 32;
const M_LOGO_FULL = M_LOGO_CONTENT + M_LOGO_PADDING; // 158
const M_VERTICAL_GAP = 32;        // logo と title の縦間隔 (mb-8)
const M_TITLE_W = 280;
const M_TITLE_H = 100;
const M_VB_W = Math.max(M_LOGO_FULL, M_TITLE_W);
const M_VB_H = M_LOGO_FULL + M_VERTICAL_GAP + M_TITLE_H;

// 共通: 太字テキストレンダリングのスタイル (CSS 由来の font 設定を SVG に当てる)
const TITLE_TEXT_STYLE_DESKTOP: React.CSSProperties = {
    fontSize: '6rem',
    fontWeight: 900,
    letterSpacing: '-0.05em',
    lineHeight: 0.85,
    fontFamily: 'inherit',
};
const TITLE_TEXT_STYLE_MOBILE: React.CSSProperties = {
    fontSize: '12vw',
    fontWeight: 900,
    letterSpacing: '-0.05em',
    lineHeight: 0.85,
    fontFamily: 'inherit',
};
const SUBTITLE_TEXT_STYLE: React.CSSProperties = {
    fontSize: '0.875rem', // text-sm
    fontWeight: 700,
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono, ui-monospace), monospace',
};
const SUBTITLE_TEXT_STYLE_MOBILE: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono, ui-monospace), monospace',
};

// 9 cell の grid 内座標 (col*step, row*step) を返す。step = SIZE + GAP
const cellOrigin = (i: number, step: number) => ({
    col: i % 3,
    row: Math.floor(i / 3),
    x: (i % 3) * step,
    y: Math.floor(i / 3) * step,
});

interface LogoSubProps {
    skipIntro: boolean;
    SIZE: number;
    GAP: number;
    BORDER: number;
    CONTENT: number;
    timing: LogoTimingProfile;
}

const LogoCells = ({ skipIntro, SIZE, GAP, BORDER, timing }: LogoSubProps) => {
    const step = SIZE + GAP;
    const skipT = { duration: 0, delay: 0 };
    const easeQuint = [0.83, 0, 0.17, 1] as const;

    // border-box 50x50 を SVG で再現: stroke を中央配置するため
    // x=BORDER/2, y=BORDER/2, w=SIZE-BORDER, h=SIZE-BORDER, stroke-width=BORDER
    // → 外周 (0,0) ~ (SIZE,SIZE) に一致
    const innerHalf = BORDER / 2;
    const innerSize = SIZE - BORDER;

    // 中央セル (index 4) の塗り
    const c4 = cellOrigin(4, step);
    // 上両端 (index 0, 2) 塗りつぶし
    const c0 = cellOrigin(0, step);
    const c2 = cellOrigin(2, step);
    // 上中央 (index 1) drop down
    const c1 = cellOrigin(1, step);
    // ドロップの最終高さ = 3 cells + 2 gaps
    const dropFullH = SIZE + GAP + SIZE + GAP + SIZE; // = CONTENT

    return (
        <g>
            {/* 9 cell の枠 (中央セル 4 を除く 8 つは常時表示)。
                cell 4 だけは枠自体が点滅するので下で別途 motion.rect で描画する。 */}
            {[0, 1, 2, 3, 5, 6, 7, 8].map((i) => {
                const o = cellOrigin(i, step);
                return (
                    <rect
                        key={`b${i}`}
                        x={o.x + innerHalf}
                        y={o.y + innerHalf}
                        width={innerSize}
                        height={innerSize}
                        fill="none"
                        stroke="var(--color-logo)"
                        strokeWidth={BORDER}
                    />
                );
            })}

            {/* 中央セル (index 4) の枠の点滅。塗りは出さず stroke のみ blink。
                blink 終了後は枠が出っぱなしになり、その後の drop down (cell 1 から
                伸びる塗り) が cell 4 の内部を覆うので塗りが現れる演出となる。 */}
            <motion.rect
                x={c4.x + innerHalf}
                y={c4.y + innerHalf}
                width={innerSize}
                height={innerSize}
                fill="none"
                stroke="var(--color-logo)"
                strokeWidth={BORDER}
                initial={{ opacity: skipIntro ? 1 : 0 }}
                animate={{
                    opacity: skipIntro ? 1 : [0, 0, 1, 1, 0, 0, 1, 1],
                }}
                transition={
                    skipIntro
                        ? skipT
                        : {
                              duration: msToS(timing.blink.duration),
                              times: [0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1],
                              ease: 'linear',
                              delay: msToS(timing.blink.start),
                          }
                }
            />

            {/* 上両端 (index 0, 2) 塗りつぶし: scaleY 0→1 origin top */}
            {[
                { key: 'f0', x: c0.x, y: c0.y, delay: msToS(timing.fill.start) },
                { key: 'f2', x: c2.x, y: c2.y, delay: msToS(timing.fill.start) + msToS(timing.fill.stagger) },
            ].map((p) => (
                <motion.rect
                    key={p.key}
                    x={p.x}
                    y={p.y}
                    width={SIZE}
                    height={SIZE}
                    fill="var(--color-logo)"
                    initial={{ scaleY: skipIntro ? 1 : 0 }}
                    animate={{ scaleY: 1 }}
                    transition={
                        skipIntro
                            ? skipT
                            : {
                                  duration: msToS(timing.fill.duration),
                                  ease: 'circOut',
                                  delay: p.delay,
                              }
                    }
                    style={{
                        // SVG: transformBox=fill-box + transformOrigin=top で
                        // 「上端固定の下方向への伸び」
                        transformBox: 'fill-box',
                        transformOrigin: 'top',
                    }}
                />
            ))}

            {/* 上中央 (index 1) drop down: height 0→dropFullH */}
            <motion.rect
                x={c1.x}
                y={c1.y}
                width={SIZE}
                fill="var(--color-logo)"
                initial={{ height: skipIntro ? dropFullH : 0 }}
                animate={{ height: dropFullH }}
                transition={
                    skipIntro
                        ? skipT
                        : {
                              duration: msToS(timing.drop.duration),
                              delay: msToS(timing.drop.start),
                              ease: easeQuint as unknown as [number, number, number, number],
                          }
                }
            />
        </g>
    );
};

export const SvgLogoTitle = ({ skipIntro = false, layout }: Props) => {
    const easeQuint = [0.83, 0, 0.17, 1] as const;
    const skipT = { duration: 0, delay: 0 };

    if (layout === 'desktop') {
        // logo group の最終位置: SVG 中央から左へ shift
        // viewBox は (logo + gap + title) を左から右に並べる形で作っているので、
        // logo は初期 x=0 (= viewBox 左端 padding 内)、最終 x はそのまま (left-aligned)。
        // mount 直後はロゴが SVG 全体の中央に居て、後に左端へ移動するイメージを再現する:
        //   初期 (logoMove 前): logo を viewBox 中央へ + (D_VB_W/2 - D_LOGO_FULL/2)
        //   最終 (logoMove 後): logo は viewBox 左端 (= 0 シフト)
        const initialLogoShift = (D_VB_W - D_LOGO_FULL) / 2;

        // タイトルテキストは固定座標 (logo の右隣)
        const titleX = D_LOGO_FULL + D_TITLE_GAP;
        const titleY = D_LOGO_FULL / 2; // 縦中央

        // logo cell グリッドの 0,0 を logo padding 内側に配置
        // logo group transform で全体平行移動
        return (
            <svg
                width={D_VB_W}
                height={D_VB_H}
                viewBox={`0 0 ${D_VB_W} ${D_VB_H}`}
                style={{
                    overflow: 'visible',
                    color: 'var(--color-foreground)',
                    fontFamily: 'inherit',
                }}
                aria-label="Shogo Toyoshima"
            >
                <defs>
                    {/* clip reveal: inset 23.8% → -1% を logo content (210x210) 基準で再現 */}
                    <clipPath id="svg-logo-clip-d">
                        <motion.rect
                            initial={{
                                x: skipIntro ? -D_LOGO_CONTENT * 0.01 : D_LOGO_CONTENT * 0.238,
                                y: skipIntro ? -D_LOGO_CONTENT * 0.01 : D_LOGO_CONTENT * 0.238,
                                width: skipIntro ? D_LOGO_CONTENT * 1.02 : D_LOGO_CONTENT * 0.524,
                                height: skipIntro ? D_LOGO_CONTENT * 1.02 : D_LOGO_CONTENT * 0.524,
                            }}
                            animate={{
                                x: -D_LOGO_CONTENT * 0.01,
                                y: -D_LOGO_CONTENT * 0.01,
                                width: D_LOGO_CONTENT * 1.02,
                                height: D_LOGO_CONTENT * 1.02,
                            }}
                            transition={
                                skipIntro
                                    ? skipT
                                    : {
                                          delay: msToS(MAIN_TITLE_TIMING_MS.logoExpandStart),
                                          duration: msToS(MAIN_TITLE_TIMING_MS.logoExpandDuration),
                                          ease: easeQuint as unknown as [number, number, number, number],
                                      }
                            }
                        />
                    </clipPath>
                </defs>

                {/* Logo group: 初期 (中央) → 最終 (左端) へ x シフト */}
                <motion.g
                    initial={{ x: skipIntro ? 0 : initialLogoShift }}
                    animate={{ x: 0 }}
                    transition={
                        skipIntro
                            ? skipT
                            : {
                                  delay: msToS(MAIN_TITLE_TIMING_MS.desktop.logoMoveStart),
                                  duration: msToS(MAIN_TITLE_TIMING_MS.desktop.logoMoveDuration),
                                  ease: easeQuint as unknown as [number, number, number, number],
                              }
                    }
                >
                    {/* logo content area の (0,0) を padding 内側に */}
                    <g
                        transform={`translate(${D_LOGO_PADDING / 2}, ${D_LOGO_PADDING / 2})`}
                        clipPath="url(#svg-logo-clip-d)"
                    >
                        <LogoCells
                            skipIntro={skipIntro}
                            SIZE={D_SIZE}
                            GAP={D_GAP}
                            BORDER={D_BORDER}
                            CONTENT={D_LOGO_CONTENT}
                            timing={DESKTOP_LOGO_TIMING}
                        />
                    </g>
                </motion.g>

                {/* Title group: text slide-in + fade */}
                <motion.g
                    initial={{ x: skipIntro ? 0 : -100, opacity: skipIntro ? 1 : 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={
                        skipIntro
                            ? skipT
                            : {
                                  delay: msToS(MAIN_TITLE_TIMING_MS.desktop.textAppearStart),
                                  duration: msToS(MAIN_TITLE_TIMING_MS.desktop.textAppearDuration),
                                  ease: easeQuint as unknown as [number, number, number, number],
                              }
                    }
                >
                    <text
                        x={titleX}
                        y={titleY - 30}
                        fill="var(--color-foreground)"
                        style={TITLE_TEXT_STYLE_DESKTOP}
                        dominantBaseline="middle"
                    >
                        TOYO
                    </text>
                    <text
                        x={titleX}
                        y={titleY + 60}
                        fill="var(--color-foreground)"
                        style={TITLE_TEXT_STYLE_DESKTOP}
                        dominantBaseline="middle"
                    >
                        SHIMA
                    </text>
                    {/* アクセント横線 */}
                    <line
                        x1={titleX}
                        y1={titleY + 120}
                        x2={titleX + 48}
                        y2={titleY + 120}
                        stroke="var(--color-accent)"
                        strokeWidth={2}
                    />
                    <text
                        x={titleX + 64}
                        y={titleY + 120}
                        fill="var(--color-accent)"
                        style={SUBTITLE_TEXT_STYLE}
                        dominantBaseline="middle"
                    >
                        Product Engineer
                    </text>
                </motion.g>
            </svg>
        );
    }

    // mobile layout
    const logoOriginX = (M_VB_W - M_LOGO_FULL) / 2;
    const titleCenterX = M_VB_W / 2;
    const titleTopY = M_LOGO_FULL + M_VERTICAL_GAP;

    return (
        <svg
            width="100%"
            height="auto"
            viewBox={`0 0 ${M_VB_W} ${M_VB_H}`}
            style={{
                overflow: 'visible',
                color: 'var(--color-foreground)',
                fontFamily: 'inherit',
                maxWidth: M_VB_W,
            }}
            aria-label="Shogo Toyoshima"
        >
            <defs>
                <clipPath id="svg-logo-clip-m">
                    <motion.rect
                        initial={{
                            x: skipIntro ? -M_LOGO_CONTENT * 0.01 : M_LOGO_CONTENT * 0.238,
                            y: skipIntro ? -M_LOGO_CONTENT * 0.01 : M_LOGO_CONTENT * 0.238,
                            width: skipIntro ? M_LOGO_CONTENT * 1.02 : M_LOGO_CONTENT * 0.524,
                            height: skipIntro ? M_LOGO_CONTENT * 1.02 : M_LOGO_CONTENT * 0.524,
                        }}
                        animate={{
                            x: -M_LOGO_CONTENT * 0.01,
                            y: -M_LOGO_CONTENT * 0.01,
                            width: M_LOGO_CONTENT * 1.02,
                            height: M_LOGO_CONTENT * 1.02,
                        }}
                        transition={
                            skipIntro
                                ? skipT
                                : {
                                      delay: msToS(MAIN_TITLE_TIMING_MS.logoExpandStart),
                                      duration: msToS(MAIN_TITLE_TIMING_MS.logoExpandDuration),
                                      ease: easeQuint as unknown as [number, number, number, number],
                                  }
                        }
                    />
                </clipPath>
            </defs>

            <g
                transform={`translate(${logoOriginX + M_LOGO_PADDING / 2}, ${M_LOGO_PADDING / 2})`}
                clipPath="url(#svg-logo-clip-m)"
            >
                <LogoCells
                    skipIntro={skipIntro}
                    SIZE={M_SIZE}
                    GAP={M_GAP}
                    BORDER={M_BORDER}
                    CONTENT={M_LOGO_CONTENT}
                    timing={MOBILE_LOGO_TIMING}
                />
            </g>

            <motion.g
                initial={{ y: skipIntro ? 0 : 20, opacity: skipIntro ? 1 : 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={
                    skipIntro
                        ? skipT
                        : {
                              delay: msToS(MAIN_TITLE_TIMING_MS.mobile.textAppearStart),
                              duration: msToS(MAIN_TITLE_TIMING_MS.mobile.textAppearDuration),
                              ease: easeQuint as unknown as [number, number, number, number],
                          }
                }
            >
                <text
                    x={titleCenterX}
                    y={titleTopY + 30}
                    fill="var(--color-foreground)"
                    style={TITLE_TEXT_STYLE_MOBILE}
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    SHOGO
                </text>
                <text
                    x={titleCenterX}
                    y={titleTopY + 70}
                    fill="var(--color-foreground)"
                    style={TITLE_TEXT_STYLE_MOBILE}
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    TOYOSHIMA
                </text>
                <line
                    x1={titleCenterX - 60}
                    y1={titleTopY + 95}
                    x2={titleCenterX - 35}
                    y2={titleTopY + 95}
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                />
                <text
                    x={titleCenterX}
                    y={titleTopY + 95}
                    fill="var(--color-accent)"
                    style={SUBTITLE_TEXT_STYLE_MOBILE}
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    Product Engineer
                </text>
                <line
                    x1={titleCenterX + 35}
                    y1={titleTopY + 95}
                    x2={titleCenterX + 60}
                    y2={titleTopY + 95}
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                />
            </motion.g>
        </svg>
    );
};

export default SvgLogoTitle;
