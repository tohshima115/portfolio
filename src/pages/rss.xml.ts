import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export const prerender = true;

export async function GET(context) {
    const projects = await getCollection('projects');

    // Sort projects by date (newest first)
    projects.sort((a, b) => {
        const dateA = new Date(a.data.meta.date).getTime();
        const dateB = new Date(b.data.meta.date).getTime();
        return dateB - dateA;
    });

    return rss({
        title: 'Shogo Toyoshima Portfolio',
        description: 'Updates from Shogo Toyoshima - Design Engineer / UX Researcher. Portfolio items and development logs.',
        site: context.site,
        items: projects.map((post) => ({
            title: post.data.title,
            pubDate: new Date(post.data.meta.date),
            description: `New project added: ${post.data.title}`,
            // If you have a description field in frontmatter, use post.data.description
            link: `/works/${post.slug}/`,
        })),
        customData: `<language>ja-jp</language>`,
    });
}
