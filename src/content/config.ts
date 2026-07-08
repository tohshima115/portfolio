import { defineCollection, z } from 'astro:content';
import { CHAPTER_KINDS, ROLES } from '../consts';

const roleValues = ROLES.map((r) => r.value) as [string, ...string[]];
const chapterKindValues = CHAPTER_KINDS.map((k) => k.value) as [string, ...string[]];

/**
 * projects コレクションは「ディレクトリ = プロジェクト、ファイル = 章」の
 * ハブ&スポーク構造。
 *   - [slug]/index.mdx … ハブ (概要)。meta / attributes / summary を持つ
 *   - [slug]/*.mdx     … 章 (成果物単位の意思決定)。chapter を持つ
 * どちらも同じコレクションに入るため、ハブ専用フィールドと章専用フィールドは
 * それぞれ optional にして、utils/works.ts の型ガードで振り分ける。
 */
const projects = defineCollection({
    schema: ({ image }) => z.object({
        title: z.string(),
        // ---- ハブ (index.mdx) 用 ----
        meta: z.object({
            thumbnail: image().optional(),
            icon: image().optional(),
            date: z.string().or(z.date()),
            updatedDate: z.coerce.date().optional(),
            duration: z.string(),
            link: z.string().url().optional(),
        }).optional(),
        attributes: z.object({
            roles: z.array(z.enum(roleValues)),
            stack: z.array(z.string()),
        }).optional(),
        // 30秒サマリー。採用担当が最初に読む3行
        summary: z.object({
            tagline: z.string(),
            what: z.string(),
            why: z.string(),
            now: z.string(),
        }).optional(),
        // ---- 章 (index.mdx 以外) 用 ----
        chapter: z.object({
            kind: z.enum(chapterKindValues),
            order: z.number(),
            // 面接で聞かれる形の問いと、その結論一文。ハブの成果物マップに出す
            question: z.string(),
            answer: z.string(),
            hero: image().optional(),
            // 執筆中の章。ルーティング/一覧から除外される
            draft: z.boolean().default(false),
        }).optional(),
    }),
});

const blog = defineCollection({
    type: 'content',
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        tags: z.array(z.string()).optional(),
        thumbnail: image().optional(),
    }),
});

const _pages = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        order: z.number().optional(),
        // about.mdx 専用の構造化データ (他の _pages では undefined)
        headline: z.tuple([z.string(), z.string()]).optional(),
        roleLabel: z.string().optional(),
        consistencyTable: z
            .array(
                z.object({
                    title: z.string(),
                    type: z.string(),
                    body: z.string(),
                }),
            )
            .optional(),
        statusText: z.string().optional(),
        statusNote: z.string().optional(),
    }),
});

export const collections = {
    projects,
    blog,
    _pages,
};
