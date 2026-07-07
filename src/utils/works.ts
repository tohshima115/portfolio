import { getCollection, type CollectionEntry } from 'astro:content';
import { CHAPTER_KINDS, type ChapterKind } from '@/consts';

/**
 * projects コレクション (ハブ&スポーク構造) を扱うヘルパー。
 *   - ハブ: [project]/index.mdx → entry.slug = "aichatclip" (Astro が /index を落とす)
 *   - 章 : [project]/logo.mdx  → entry.slug = "aichatclip/logo"
 * URL 上は /works/aichatclip と /works/aichatclip/logo に対応する。
 */

export type ProjectEntry = CollectionEntry<'projects'>;

export const isHub = (entry: ProjectEntry): boolean =>
    !entry.slug.includes('/');

export const isChapter = (entry: ProjectEntry): boolean =>
    !isHub(entry) && entry.data.chapter !== undefined;

/** entry が属するプロジェクトの slug ("aichatclip" 等) */
export const projectSlugOf = (entry: ProjectEntry): string =>
    entry.slug.split('/')[0];

/** 章の slug ("logo" 等)。ハブに対して呼ぶと "index" が返るので注意 */
export const chapterSlugOf = (entry: ProjectEntry): string =>
    entry.slug.split('/').slice(1).join('/');

/** 全ハブを日付降順で返す */
export async function getHubs(): Promise<ProjectEntry[]> {
    const entries = await getCollection('projects');
    return entries
        .filter(isHub)
        .sort(
            (a, b) =>
                new Date(String(b.data.meta?.date ?? 0)).getTime() -
                new Date(String(a.data.meta?.date ?? 0)).getTime(),
        );
}

/** 指定プロジェクトの公開済み章を order 昇順で返す */
export async function getChapters(projectSlug: string): Promise<ProjectEntry[]> {
    const entries = await getCollection('projects');
    return entries
        .filter(
            (e) =>
                isChapter(e) &&
                projectSlugOf(e) === projectSlug &&
                !e.data.chapter?.draft,
        )
        .sort((a, b) => (a.data.chapter?.order ?? 0) - (b.data.chapter?.order ?? 0));
}

export interface ChapterKindMeta {
    label: string;
    en: string;
    value: ChapterKind;
}

export const kindMeta = (value: string): ChapterKindMeta => {
    const found = CHAPTER_KINDS.find((k) => k.value === value);
    return (found ?? { label: value, en: value, value }) as ChapterKindMeta;
};
