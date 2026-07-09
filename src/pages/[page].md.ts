import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { buildMarkdownResponse, pageMarkdown } from '@/utils/markdown-export';

export const getStaticPaths: GetStaticPaths = async () => {
    const pages = await getCollection('_pages');
    return pages
        .filter((entry) => entry.id !== 'home')
        .map((entry) => ({
            params: { page: entry.id },
            props: { entry },
        }));
};

type Props = { entry: CollectionEntry<'_pages'> };

export const GET: APIRoute<Props> = ({ props }) => {
    const { entry } = props;
    const canonicalPath = entry.id === 'projects' || entry.id === 'blog'
        ? `/${entry.id}`
        : `/${entry.id}`;
    return buildMarkdownResponse(pageMarkdown(entry, canonicalPath));
};
