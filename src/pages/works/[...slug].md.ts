import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { buildMarkdownResponse, projectMarkdown } from '@/utils/markdown-export';
import { chapterSlugOf, isChapter, isHub, projectSlugOf } from '@/utils/works';

export const getStaticPaths: GetStaticPaths = async () => {
    const entries = await getCollection('projects');
    return entries
        .filter((e) => isHub(e) || (isChapter(e) && !e.data.chapter?.draft))
        .map((entry) => ({
            params: {
                // ハブ: /works/aichatclip.md、章: /works/aichatclip/logo.md
                slug: isHub(entry)
                    ? projectSlugOf(entry)
                    : `${projectSlugOf(entry)}/${chapterSlugOf(entry)}`,
            },
            props: { entry },
        }));
};

type Props = { entry: CollectionEntry<'projects'> };

export const GET: APIRoute<Props> = ({ props }) => {
    return buildMarkdownResponse(projectMarkdown(props.entry));
};
