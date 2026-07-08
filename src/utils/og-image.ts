/**
 * OGP 画像 (1200x630 PNG) の生成。
 *
 * トップの Hero と同じ「下中央起点のドーム型グラデーション + グレイン」を背景に敷き、
 * 上に小さなセクション名、中央にページ固有のタイトル、下にロゴ + TOYOSHIMA を置く。
 *
 * satori (JSX ライクなオブジェクト → SVG) → resvg (SVG → PNG) の 2 段構成。
 * 呼び出し元は prerender される OG エンドポイントのみなので、実行はビルド時だけ。
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** global.css のトークンを解決した実値 (satori は CSS 変数を解釈しないため直値で持つ) */
const COLOR = {
    background: '#f6f5ee',
    foreground: '#18160c',
    accent: '#f9b800',
    logo: '#299c39',
};

// Hero と同じ 6 段階のストップ。ただし OG は 1200x630 と横長なので、
// ドームの半径だけ画面に合わせて詰めている (でないと画面の大半が明るくなり、
// 白い見出しが読めなくなる)。glow は下端に寄せ、中央〜上は暗いまま残す。
const DOME = { cx: OG_WIDTH / 2, cy: OG_HEIGHT, rx: 1250, ry: 320 };
const DOME_STOPS: [number, string][] = [
    [0, COLOR.background],
    [0.34, '#e3f1d8'],
    [0.47, '#7fc95d'],
    [0.68, '#2c7a3c'],
    [0.95, '#081b0f'],
    [1, '#020603'],
];

const FONT_DIR = resolve(process.cwd(), 'src/assets/fonts');
const LOGO_PATH = resolve(process.cwd(), 'public/Iogo.svg');

// ----------------------------------------------------------------------------
// アセット (フォント・背景・ロゴ) は 1 プロセス内で使い回す
// ----------------------------------------------------------------------------

type SatoriFont = Parameters<typeof satori>[1]['fonts'][number];

let fontsPromise: Promise<SatoriFont[]> | undefined;
let backgroundPromise: Promise<string> | undefined;
let logoPromise: Promise<string> | undefined;

const loadFonts = (): Promise<SatoriFont[]> =>
    (fontsPromise ??= Promise.all(
        (
            [
                ['Roboto', 'Roboto-Regular.woff', 400],
                ['Roboto', 'Roboto-Black.woff', 900],
                ['Roboto Mono', 'RobotoMono-Medium.woff', 500],
                ['Noto Sans JP', 'NotoSansJP-Black.woff', 900],
            ] as const
        ).map(async ([name, file, weight]) => ({
            name,
            data: await readFile(resolve(FONT_DIR, file)),
            weight: weight as SatoriFont['weight'],
            style: 'normal' as const,
        })),
    ));

/** SVG 文字列を PNG の data URI にする。satori に食わせる <img> 用。 */
function svgToDataUri(svg: string, width: number): string {
    const png = new Resvg(svg, {
        fitTo: { mode: 'width', value: width },
        font: { loadSystemFonts: false },
    })
        .render()
        .asPng();
    return `data:image/png;base64,${png.toString('base64')}`;
}

/**
 * 背景。ドーム型 radial-gradient + 下端を background 色へ収束させるフェード +
 * feTurbulence のグレイン (Hero の canvas ノイズ相当) を overlay 合成。
 * satori の radial-gradient は ellipse + 任意サイズの再現が怪しいので、
 * SVG として自前で描いて PNG 化したものを 1 枚の <img> として敷く。
 */
const loadBackground = (): Promise<string> =>
    (backgroundPromise ??= Promise.resolve().then(() => {
        const stops = DOME_STOPS.map(
            ([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`,
        ).join('');
        // userSpaceOnUse の円 (r = ry) を x 方向に引き伸ばして楕円にする
        const scaleX = DOME.rx / DOME.ry;
        const fadeTop = 520;

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">
  <defs>
    <radialGradient id="dome" gradientUnits="userSpaceOnUse"
      cx="${DOME.cx}" cy="${DOME.cy}" r="${DOME.ry}"
      gradientTransform="translate(${DOME.cx} ${DOME.cy}) scale(${scaleX} 1) translate(${-DOME.cx} ${-DOME.cy})">
      ${stops}
    </radialGradient>
    <linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="0" y1="${fadeTop}" x2="0" y2="${OG_HEIGHT}">
      <stop offset="0" stop-color="${COLOR.background}" stop-opacity="0"/>
      <stop offset="0.9" stop-color="${COLOR.background}" stop-opacity="1"/>
    </linearGradient>
    <!-- Hero の canvas グレイン相当。バンディングを潰すためのディザで、
         opacity は Hero の 0.12 ではなく 0.08。ノイズは PNG の圧縮が効かず
         そのままファイルサイズになる (0.12: 450KB / 0.08: 380KB / なし: 125KB) 一方、
         SNS 上では縮小表示されるので、この程度で十分ディザとして機能する。 -->
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
    </filter>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#dome)"/>
  <rect y="${fadeTop}" width="${OG_WIDTH}" height="${OG_HEIGHT - fadeTop}" fill="url(#fade)"/>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" filter="url(#grain)" opacity="0.08" style="mix-blend-mode:overlay"/>
</svg>`;

        return svgToDataUri(svg, OG_WIDTH);
    }));

/** サイトのロゴマーク。satori に渡すため PNG 化しておく (2x で焼いて縮小表示) */
const loadLogo = (): Promise<string> =>
    (logoPromise ??= readFile(LOGO_PATH, 'utf8').then((svg) => svgToDataUri(svg, 128)));

// ----------------------------------------------------------------------------
// レイアウト
// ----------------------------------------------------------------------------

type Node = { type: string; props: Record<string, unknown> };

const el = (type: string, props: Record<string, unknown>): Node => ({ type, props });

/**
 * 日本語 1 文字 = 1、ASCII 1 文字 = 0.55 として「見た目の長さ」を測り、
 * 3 行に収まるフォントサイズを選ぶ。
 */
function titleFontSize(title: string): number {
    const len = [...title].reduce((n, c) => n + (/[\x20-\x7E]/.test(c) ? 0.55 : 1), 0);
    if (len <= 12) return 76;
    if (len <= 20) return 66;
    if (len <= 30) return 56;
    return 48;
}

export interface OgContent {
    /** 上部に小さく置くセクション名。例: "BLOG" / "WORKS / AICHATCLIP" */
    label: string;
    /** 中央に置くページ固有のタイトル */
    title: string;
}

export async function renderOgImage({ label, title }: OgContent): Promise<Buffer> {
    const [fonts, background, logo] = await Promise.all([
        loadFonts(),
        loadBackground(),
        loadLogo(),
    ]);

    const root = el('div', {
        style: {
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            width: OG_WIDTH,
            height: OG_HEIGHT,
            backgroundColor: COLOR.background,
        },
        children: [
            el('img', {
                src: background,
                width: OG_WIDTH,
                height: OG_HEIGHT,
                style: { position: 'absolute', top: 0, left: 0 },
            }),

            // 本文: フッターの高さを除いた領域の中央に置く
            el('div', {
                style: {
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '72px 88px 0',
                },
                children: [
                    el('div', {
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            marginBottom: 30,
                            fontFamily: 'Roboto Mono',
                            fontWeight: 500,
                            fontSize: 22,
                            letterSpacing: '0.3em',
                        },
                        children: [
                            el('span', { style: { color: COLOR.accent }, children: '+' }),
                            el('span', {
                                style: { color: 'rgba(255,255,255,0.72)' },
                                children: label.toUpperCase(),
                            }),
                        ],
                    }),
                    el('div', {
                        style: {
                            display: 'block',
                            maxWidth: 1000,
                            fontFamily: 'Roboto, Noto Sans JP',
                            fontWeight: 900,
                            fontSize: titleFontSize(title),
                            lineHeight: 1.32,
                            letterSpacing: '-0.01em',
                            textAlign: 'center',
                            color: '#ffffff',
                            textOverflow: 'ellipsis',
                            // @ts-expect-error satori 独自のプロパティ
                            lineClamp: 3,
                        },
                        children: title,
                    }),
                ],
            }),

            // フッター: 明るく収束した下端に、ヘッダーと同じ「緑のロゴ + 黒の TOYOSHIMA」
            el('div', {
                style: {
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    padding: '0 88px 64px',
                },
                children: [
                    el('img', { src: logo, width: 44, height: 44 }),
                    el('div', {
                        style: {
                            fontFamily: 'Roboto',
                            fontWeight: 900,
                            fontSize: 30,
                            letterSpacing: '-0.01em',
                            color: COLOR.foreground,
                        },
                        children: 'TOYOSHIMA',
                    }),
                ],
            }),
        ],
    });

    const svg = await satori(root as never, { width: OG_WIDTH, height: OG_HEIGHT, fonts });

    return Buffer.from(
        new Resvg(svg, {
            fitTo: { mode: 'width', value: OG_WIDTH },
            font: { loadSystemFonts: false },
        })
            .render()
            .asPng(),
    );
}
