import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { buildMarkdownResponse, pageMarkdown } from '@/utils/markdown-export';

export const GET: APIRoute = async () => {
    const home = await getEntry('_pages', 'home');
    if (!home) {
        return new Response('Not Found', { status: 404 });
    }
    return buildMarkdownResponse(pageMarkdown(home, '/'));
};
