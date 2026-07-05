import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
    absoluteUrl,
    blogMarkdown,
    buildPlainTextResponse,
    pageMarkdown,
    projectMarkdown,
} from '@/utils/markdown-export';

const SEPARATOR = '\n\n---\n\n';

export const GET: APIRoute = async () => {
    const projects = (await getCollection('projects')).sort(
        (a, b) => new Date(b.data.meta.date).valueOf() - new Date(a.data.meta.date).valueOf(),
    );
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
        const path = entry.slug === 'home' ? '/' : `/${entry.slug}`;
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
