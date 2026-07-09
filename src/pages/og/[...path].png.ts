/**
 * 全ページ分の OGP 画像をビルド時に静的生成する。
 *
 * URL は `/og{ページのパス}.png` (トップだけ `/og/index.png`)。
 * BaseLayout の `ogImagePath()` が同じ規則で参照するので、ここで列挙する
 * ルートはサイトの実ページと 1:1 で揃えること。
 */

import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgImage, type OgContent } from '@/utils/og-image';
import { getHubs, getChapters } from '@/utils/works';

export const prerender = true;

/** 固定ページ。`path` は `/og/{path}.png` の {path} に入る */
const STATIC_PAGES: (OgContent & { path: string })[] = [
    { path: 'index', label: 'Portfolio', title: '豊島昇悟のポートフォリオサイト' },
    { path: 'about', label: 'About', title: '豊島昇悟について' },
    { path: 'works', label: 'Works', title: 'これまでにつくったもの' },
    { path: 'blog', label: 'Blog', title: '開発と思考の記録' },
    { path: 'contact', label: 'Contact', title: '気軽にご連絡ください' },
    { path: 'system', label: 'System', title: 'このサイトの設計ガイド' },
];

export const getStaticPaths: GetStaticPaths = async () => {
    const posts = await getCollection('blog');

    const chapters = await Promise.all(
        (await getHubs()).map(async (hub) => {
            const list = await getChapters(hub.id);
            return list.map((chapter) => ({
                params: { path: `works/${hub.id}/${chapter.id.split('/').slice(1).join('/')}` },
                props: {
                    label: `Works / ${hub.data.title}`,
                    title: chapter.data.title,
                } satisfies OgContent,
            }));
        }),
    );

    return [
        ...STATIC_PAGES.map(({ path, ...props }) => ({ params: { path }, props })),
        ...posts.map((post) => ({
            params: { path: `blog/${post.id}` },
            props: { label: 'Blog', title: post.data.title } satisfies OgContent,
        })),
        ...(await getHubs()).map((hub) => ({
            params: { path: `works/${hub.id}` },
            props: { label: 'Works', title: hub.data.title } satisfies OgContent,
        })),
        ...chapters.flat(),
    ];
};

export const GET: APIRoute = async ({ props }) => {
    const png = await renderOgImage(props as OgContent);

    return new Response(new Uint8Array(png), {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
};
