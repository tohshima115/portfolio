import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { blogMarkdown, buildMarkdownResponse } from '@/utils/markdown-export';

export const getStaticPaths: GetStaticPaths = async () => {
    const posts = await getCollection('blog');
    return posts.map((entry) => ({
        params: { slug: entry.slug },
        props: { entry },
    }));
};

type Props = { entry: CollectionEntry<'blog'> };

export const GET: APIRoute<Props> = ({ props }) => {
    return buildMarkdownResponse(blogMarkdown(props.entry));
};
