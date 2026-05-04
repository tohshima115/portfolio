import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { buildMarkdownResponse, projectMarkdown } from '@/utils/markdown-export';

export const getStaticPaths: GetStaticPaths = async () => {
    const projects = await getCollection('projects');
    return projects.map((entry) => ({
        params: { slug: entry.slug },
        props: { entry },
    }));
};

type Props = { entry: CollectionEntry<'projects'> };

export const GET: APIRoute<Props> = ({ props }) => {
    return buildMarkdownResponse(projectMarkdown(props.entry));
};
