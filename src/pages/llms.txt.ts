import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { absoluteUrl, buildPlainTextResponse, projectSummary } from '@/utils/markdown-export';
import { chapterSlugOf, getChapters, getHubs, projectSlugOf } from '@/utils/works';

export const GET: APIRoute = async () => {
    const projects = await getHubs();
    const posts = (await getCollection('blog')).sort(
        (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
    );
    const pages = (await getCollection('_pages')).sort(
        (a, b) => (a.data.order ?? 0) - (b.data.order ?? 0),
    );

    const lines: string[] = [];
    lines.push('# Shogo Toyoshima Portfolio');
    lines.push('');
    lines.push('> Shogo Toyoshima (Product Engineer / Designer) のポートフォリオ。Cloudflare スタックで個人プロダクトを出荷している26歳。プロジェクト事例 (個人プロダクト・業務改善・デザイン)、ブログ、プロフィールを含む。各ページは末尾に .md を付けることで生のMarkdownとして取得できます。');
    lines.push('');

    lines.push('## Works');
    lines.push('');
    for (const entry of projects) {
        const projectSlug = projectSlugOf(entry);
        const url = absoluteUrl(`/works/${projectSlug}.md`);
        const summary = projectSummary(entry);
        lines.push(`- [${entry.data.title}](${url}): ${summary}`);
        // 章 (成果物単位の意思決定ページ) はネストして列挙
        const chapters = await getChapters(projectSlug);
        for (const ch of chapters) {
            const chUrl = absoluteUrl(`/works/${projectSlug}/${chapterSlugOf(ch)}.md`);
            lines.push(`  - [${ch.data.title}](${chUrl}): ${ch.data.chapter?.question} — ${ch.data.chapter?.answer}`);
        }
    }
    lines.push('');

    if (posts.length > 0) {
        lines.push('## Blog');
        lines.push('');
        for (const entry of posts) {
            const url = absoluteUrl(`/blog/${entry.id}.md`);
            lines.push(`- [${entry.data.title}](${url}): ${entry.data.description}`);
        }
        lines.push('');
    }

    lines.push('## Pages');
    lines.push('');
    for (const entry of pages) {
        const path = entry.id === 'home' ? '/index.md' : `/${entry.id}.md`;
        const url = absoluteUrl(path);
        const desc = entry.data.description ?? entry.data.title;
        lines.push(`- [${entry.data.title}](${url}): ${desc}`);
    }
    lines.push('');

    lines.push('## Optional');
    lines.push('');
    lines.push(`- [Full content](${absoluteUrl('/llms-full.txt')}): 全ページの生Markdownを1ファイルに連結したもの`);
    lines.push(`- [RSS feed](${absoluteUrl('/rss.xml')}): プロジェクト・ブログ更新の購読用フィード`);
    lines.push('');

    return buildPlainTextResponse(lines.join('\n'));
};
