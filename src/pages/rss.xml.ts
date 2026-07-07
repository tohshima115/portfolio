import rss from '@astrojs/rss';
import { getHubs, projectSlugOf } from '@/utils/works';

export const prerender = true;

export async function GET(context) {
    // 章は含めず、プロジェクト (ハブ) 単位で配信する
    const projects = await getHubs();

    return rss({
        title: 'Shogo Toyoshima Portfolio',
        description: 'Updates from Shogo Toyoshima — Product Engineer / Designer. Portfolio items and development logs.',
        site: context.site,
        items: projects.map((post) => ({
            title: post.data.title,
            pubDate: new Date(post.data.meta?.date ?? Date.now()),
            description: `New project added: ${post.data.title}`,
            link: `/works/${projectSlugOf(post)}/`,
        })),
        customData: `<language>ja-jp</language>`,
    });
}
