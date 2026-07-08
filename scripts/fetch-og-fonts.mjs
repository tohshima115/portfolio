// OGP 画像生成 (satori) 用のフォントを取得して src/assets/fonts/ に置く。
//
// satori は woff2 を読めないため、Google Fonts に「woff しか解釈できない古い UA」で
// リクエストして woff の URL を引く。取得したファイルはリポジトリにコミットするので、
// このスクリプトはフォントを差し替えたいときだけ実行すればよい。
//
//   pnpm exec node scripts/fetch-og-fonts.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../src/assets/fonts');

// woff を返させるための UA (Chrome 25 相当)。新しい UA だと woff2 が返ってきてしまう。
const LEGACY_UA =
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/25.0.1364.97 Safari/537.36';

/** @type {{ file: string; query: string }[]} */
const FONTS = [
    { file: 'Roboto-Regular.woff', query: 'family=Roboto:wght@400' },
    { file: 'Roboto-Black.woff', query: 'family=Roboto:wght@900' },
    { file: 'RobotoMono-Medium.woff', query: 'family=Roboto+Mono:wght@500' },
    { file: 'NotoSansJP-Black.woff', query: 'family=Noto+Sans+JP:wght@900' },
];

async function resolveWoffUrl(query) {
    const css = await fetch(`https://fonts.googleapis.com/css2?${query}`, {
        headers: { 'User-Agent': LEGACY_UA },
    }).then((r) => r.text());

    const match = css.match(/url\((https:\/\/[^)]+\.woff)\)/);
    if (!match) throw new Error(`woff の URL が見つかりませんでした: ${query}\n${css}`);
    return match[1];
}

await mkdir(OUT_DIR, { recursive: true });

for (const { file, query } of FONTS) {
    const url = await resolveWoffUrl(query);
    const buf = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
    await writeFile(resolve(OUT_DIR, file), buf);
    console.log(`${file}  ${(buf.length / 1024).toFixed(0)} KB  ← ${url}`);
}
