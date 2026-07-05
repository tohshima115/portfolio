// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import mdx from '@astrojs/mdx';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
    site: 'https://toyoshima.work',
    adapter: cloudflare({ platformProxy: { enabled: false } }),
    // 主要な下層ページをトップから即座にプリフェッチして遷移を瞬時にする。
    // data-astro-prefetch 属性が無いリンクはホバー時にフェッチ (defaultStrategy)。
    prefetch: {
        prefetchAll: false,
        defaultStrategy: 'hover',
    },
    integrations: [
        react(),
        mdx(),
        keystatic()
    ],
    vite: {
        plugins: [tailwindcss()],
    },
});
