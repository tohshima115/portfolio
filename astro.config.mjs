// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import mdx from '@astrojs/mdx';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
    adapter: cloudflare(),
    integrations: [
        react(),
        mdx(),
        keystatic()
    ],
    vite: {
        plugins: [tailwindcss()],
    },
});
