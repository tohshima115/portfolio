import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { buildMarkdownResponse, pageMarkdown } from '@/utils/markdown-export';

export const getStaticPaths: GetStaticPaths = async () => {
    const pages = await getCollection('_pages');
    return pages
        .filter((entry) => entry.slug !== 'home')
        .map((entry) => ({
            params: { page: entry.slug },
            props: { entry },
        }));
};

type Props = { entry: CollectionEntry<'_pages'> };

export const GET: APIRoute<Props> = ({ props }) => {
    const { entry } = props;
    const canonicalPath = entry.slug === 'projects' || entry.slug === 'blog'
        ? `/${entry.slug}`
        : `/${entry.slug}`;
    return buildMarkdownResponse(pageMarkdown(entry, canonicalPath));
};
