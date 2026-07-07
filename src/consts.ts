/**
 * Works の章 (chapter) の種別。
 * プロジェクト = 章の複合体、という新データ構造で、章が「何の成果物についての
 * 意思決定か」を機械可読にするためのラベル。Context Graph の接続や
 * 章カードの表示に使う。
 */
export const CHAPTER_KINDS = [
    { label: 'ロゴ・VI', en: 'Branding', value: 'branding' },
    { label: 'リサーチ', en: 'Research', value: 'research' },
    { label: 'UIデザイン', en: 'UI Design', value: 'ui' },
    { label: 'Webサイト', en: 'Web', value: 'web' },
    { label: '拡張機能', en: 'Extension', value: 'extension' },
    { label: '技術構成', en: 'Architecture', value: 'architecture' },
    { label: '運用・改善', en: 'Operation', value: 'ops' },
    { label: '映像', en: 'Motion', value: 'motion' },
    { label: '印刷物', en: 'Print', value: 'print' },
    { label: '進め方', en: 'Process', value: 'process' },
] as const;

export type ChapterKind = typeof CHAPTER_KINDS[number]['value'];

export const ROLES = [
    { label: 'UX Research', value: 'ux-research' },
    { label: 'UI Design', value: 'ui-design' },
    { label: 'Frontend Dev', value: 'frontend-dev' },
    { label: 'Backend Dev', value: 'backend-dev' },
    { label: 'Visual Identity', value: 'visual-identity' },
    { label: 'Branding', value: 'branding' },
    { label: 'Graphic Design', value: 'graphic-design' },
] as const;

export type RoleValue = typeof ROLES[number]['value'];
