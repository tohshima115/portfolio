import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
    absoluteUrl,
    blogMarkdown,
    buildPlainTextResponse,
    pageMarkdown,
    projectMarkdown,
} from '@/utils/markdown-export';
import { getChapters, getHubs, projectSlugOf } from '@/utils/works';

const SEPARATOR = '\n\n---\n\n';

export const GET: APIRoute = async () => {
    const hubs = await getHubs();
    // ハブ直後にその章が並ぶ順で連結する
    const projects = (
        await Promise.all(
            hubs.map(async (hub) => [hub, ...(await getChapters(projectSlugOf(hub)))]),
        )
    ).flat();
    const posts = (await getCollection('blog')).sort(
        (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
    );
    const pages = (await getCollection('_pages')).sort(
        (a, b) => (a.data.order ?? 0) - (b.data.order ?? 0),
    );

    const sections: string[] = [];

    sections.push(
        [
            '# Shogo Toyoshima Portfolio — Full Content',
            '',
            `> ${absoluteUrl('/')} の全ページの生Markdownを1ファイルに連結したものです。Works → Blog → Pages の順で並んでいます。`,
        ].join('\n'),
    );

    for (const entry of pages) {
        const path = entry.id === 'home' ? '/' : `/${entry.id}`;
        sections.push(pageMarkdown(entry, path));
    }

    for (const entry of projects) {
        sections.push(projectMarkdown(entry));
    }

    for (const entry of posts) {
        sections.push(blogMarkdown(entry));
    }

    return buildPlainTextResponse(sections.join(SEPARATOR));
};
