// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
    site: 'https://toyoshima.work',
    // prerenderEnvironment: 'node' … v14 の既定は 'workerd' だが、OG 画像生成が
    // ネイティブ addon の resvg-js を使うため、ビルド時プリレンダは Node で行う。
    // (workerd だと .node をバンドルできずビルドが落ちる)
    adapter: cloudflare({ prerenderEnvironment: 'node' }),
    // 主要な下層ページをトップから即座にプリフェッチして遷移を瞬時にする。
    // data-astro-prefetch 属性が無いリンクはホバー時にフェッチ (defaultStrategy)。
    prefetch: {
        prefetchAll: false,
        defaultStrategy: 'hover',
    },
    integrations: [
        react(),
        mdx()
    ],
    vite: {
        plugins: [tailwindcss()],
        ssr: {
            // OGP 画像生成 (src/pages/og/[...path].png.ts) はビルド時にだけ動く。
            // resvg-js はネイティブアドオン (.node) を抱えていて バンドラがバンドルできないため
            // external にし、Node 側の require に任せる。satori も同様に素通しする。
            external: ['@resvg/resvg-js', 'satori'],
        },
        // Vite 8 (Rolldown) + Cloudflare Vite プラグイン環境では ssr.external だけでは
        // ワーカー向けビルドに伝わらないので、バンドラ層でも明示的に外部化する。
        // これらは prerender=true の OG ルートでのみ使われ、最終ワーカーには含まれない。
        build: {
            rollupOptions: {
                external: ['@resvg/resvg-js', 'satori', /\.node$/],
            },
        },
    },
});
