import type { CollectionEntry } from 'astro:content';
import { chapterSlugOf, isChapter, projectSlugOf } from '@/utils/works';

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
    const projectSlug = projectSlugOf(entry);

    // 章 (スポーク): 意思決定のQ&Aをフロントマターに含める
    if (isChapter(entry)) {
        const ch = entry.data.chapter!;
        const fm = formatFrontmatter({
            title: entry.data.title,
            project: projectSlug,
            kind: ch.kind,
            question: ch.question,
            answer: ch.answer,
            canonical_url: absoluteUrl(`/works/${projectSlug}/${chapterSlugOf(entry)}`),
        });
        return `${fm}\n\n# ${entry.data.title}\n\n${entry.body ?? ''}`;
    }

    // ハブ (index.mdx)
    const fm = formatFrontmatter({
        title: entry.data.title,
        date:
            entry.data.meta?.date instanceof Date
                ? entry.data.meta.date
                : String(entry.data.meta?.date ?? ''),
        updatedDate: entry.data.meta?.updatedDate,
        duration: entry.data.meta?.duration,
        roles: entry.data.attributes?.roles,
        stack: entry.data.attributes?.stack,
        link: entry.data.meta?.link,
        tagline: entry.data.summary?.tagline,
        canonical_url: absoluteUrl(`/works/${projectSlug}`),
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
    if (entry.slug === 'about') {
        return aboutMarkdown(entry, canonicalPath);
    }
    const fm = formatFrontmatter({
        title: entry.data.title,
        description: entry.data.description,
        canonical_url: absoluteUrl(canonicalPath),
    });
    return `${fm}\n\n${entry.body ?? ''}`;
}

function aboutMarkdown(entry: CollectionEntry<'_pages'>, canonicalPath: string): string {
    const fm = formatFrontmatter({
        title: entry.data.title,
        description: entry.data.description,
        canonical_url: absoluteUrl(canonicalPath),
    });

    const body = `# Shogo Toyoshima

| | |
|---|---|
| 生年月日 | 1999年12月生まれ |
| 出身 | 埼玉県 |
| 在住 | 東京都 |
| ゲーム | アークナイツ（本編より PV が好き。一番早く見るためにビリビリ動画の会員になった） |
| 音楽 | アークナイツのサントラ · エレクトロスウィング |
| 漫画 | 嘘喰い · 鉄鍋のジャン · カルカラレルカ · トリコ |
| 趣味 | 麻雀（天鳳）· 囲碁（野狐囲碁） |
| Stack | Cloudflare · TypeScript · React Router v7 · Astro · Hono |
| Design | Figma · Illustrator · Material Design |
| Tools | 自作分割キーボード（Roba + 大西配列）· Aqua Voice · Claude Code · Zen ブラウザ |
| つくってるもの | AIChatClip（Chrome / Firefox 拡張 + Web + API）· サイトブロッカー |

個人プロダクトを作っています。デザイナーとして始まって、いつの間にか実装もやるようになっていました。

Cloudflare が好きで、Discord コミュニティでリリースを追いながら、必要なものを少しずつ触って知識を広げています。お金をかけずに何でも実験できる感じが気に入っています。

## もう少し詳しく

行き当たりばったりな人間です。思いつきでバッと動いて、毎回どこか変な場所にいます。大学を卒業してから好き勝手やるようにしていったら、気づいたら社会のレールからだいぶ外れていました。ただ、衝動のままに動いているときが一番前に進める気がしているので、これからもたぶんそうしていくと思います。

キャリアはデザイナーで始まりました。Figma / Illustrator で UI やビジュアルを作るところから入って、「自分の設計を自分でかたちにしたい」と思って実装まで手を伸ばしました。ちょうど Cursor が出てきた時期で、タイミングが良かったです。

Cloudflare に出会ってからはほぼ手癖で選んでいます。D1 を最初に触ったとき「むず」と思いましたが、慣れたら「めっちゃ便利」に変わりました。

こだわりは「ちょうどいい、ジャストフィット」を探すこと。最高スペックを買うのではなく、自分の要求水準にぴったりのものを選ぶ感覚です。買ったけど使っていないものがほぼないのはそのおかげだと思っています。

作業は一人でやる方が好きです。通話しながら作業しようとすると通話に集中してしまって何も進まないので、通話するときは最初から「今日は雑談の時間」と決めています。

## 経歴

**2026.01 — Present** · 個人開発「AIChatClip」
AI チャットの会話をクリップしたくて作りました。Chrome / Firefox 拡張と Web + API の SaaS として公開中です。

**2025.07 — Present** · Web制作会社
デザインと実装のクライアントワークを担当しています。最初はデザインだけでしたが、自分の設計を自分で実装した方が速いと気づいてから、環境の構成ごと引き受けるようになりました。

**2024 — 2026.01** · 社会起業チーム「Swept」
3人チームにデザイナーとして入りました。以前のチームでエンジニアが動けず実装が止まるのを見て、自分がコードを書けた方がいいと思って独学を始めていました。Swept ではその延長でデザインから実装まで一人で担うようになりました。方向性の違いから 2026 年 1 月に離れました。

**〜 2023** · 東京理科大学 経営学部 卒業
統計学専攻でした。授業よりも囲碁部の活動に力を入れていた記憶の方が強いです。`;

    return `${fm}\n\n${body}`;
}

export function projectSummary(entry: CollectionEntry<'projects'>): string {
    if (entry.data.summary?.what) {
        return entry.data.summary.what.replace(/\s+/g, ' ').slice(0, 160);
    }
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
    const stack = entry.data.attributes?.stack ?? [];
    return `Stack: ${stack.join(', ')}`;
}
