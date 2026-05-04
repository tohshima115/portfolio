import type { CollectionEntry } from 'astro:content';

const SITE = 'https://toyoshima.work';

type FrontmatterValue = string | number | boolean | string[] | Date | undefined | null;
type FrontmatterRecord = Record<string, FrontmatterValue>;

function escapeYamlString(value: string): string {
    if (value === '' || /[:#&*!|>'"%@`,?\-{}\[\]\n]/.test(value)) {
        return JSON.stringify(value);
    }
    return value;
}

export function formatFrontmatter(data: FrontmatterRecord): string {
    const lines: string[] = ['---'];
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
            if (value.length === 0) continue;
            lines.push(`${key}: [${value.map((v) => escapeYamlString(String(v))).join(', ')}]`);
        } else if (value instanceof Date) {
            lines.push(`${key}: ${value.toISOString()}`);
        } else if (typeof value === 'string') {
            lines.push(`${key}: ${escapeYamlString(value)}`);
        } else {
            lines.push(`${key}: ${value}`);
        }
    }
    lines.push('---');
    return lines.join('\n');
}

export function buildMarkdownResponse(body: string): Response {
    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}

export function buildPlainTextResponse(body: string): Response {
    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}

export function absoluteUrl(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${SITE}${normalized}`;
}

export function projectMarkdown(entry: CollectionEntry<'projects'>): string {
    const fm = formatFrontmatter({
        title: entry.data.title,
        date: entry.data.meta.date instanceof Date ? entry.data.meta.date : String(entry.data.meta.date),
        updatedDate: entry.data.meta.updatedDate,
        duration: entry.data.meta.duration,
        roles: entry.data.attributes.roles,
        stack: entry.data.attributes.stack,
        link: entry.data.meta.link,
        canonical_url: absoluteUrl(`/projects/${entry.slug}`),
    });
    return `${fm}\n\n# ${entry.data.title}\n\n${entry.body ?? ''}`;
}

export function blogMarkdown(entry: CollectionEntry<'blog'>): string {
    const fm = formatFrontmatter({
        title: entry.data.title,
        description: entry.data.description,
        pubDate: entry.data.pubDate,
        updatedDate: entry.data.updatedDate,
        tags: entry.data.tags,
        canonical_url: absoluteUrl(`/blog/${entry.slug}`),
    });
    return `${fm}\n\n# ${entry.data.title}\n\n${entry.body ?? ''}`;
}

export function pageMarkdown(entry: CollectionEntry<'_pages'>, canonicalPath: string): string {
    const fm = formatFrontmatter({
        title: entry.data.title,
        description: entry.data.description,
        canonical_url: absoluteUrl(canonicalPath),
    });
    return `${fm}\n\n${entry.body ?? ''}`;
}

export function projectSummary(entry: CollectionEntry<'projects'>): string {
    const body = entry.body ?? '';
    const firstSentence = body
        .split('\n')
        .map((line) => line.trim())
        .find(
            (line) =>
                line.length > 0 &&
                !line.startsWith('#') &&
                !line.startsWith('!') &&
                !line.startsWith('*') &&
                !line.startsWith('-') &&
                !line.startsWith('|') &&
                !line.startsWith('```') &&
                !line.startsWith('>'),
        );
    if (firstSentence) {
        return firstSentence.replace(/\s+/g, ' ').slice(0, 160);
    }
    const stack = entry.data.attributes.stack ?? [];
    return `Stack: ${stack.join(', ')}`;
}
