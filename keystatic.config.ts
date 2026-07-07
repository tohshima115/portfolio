import { config, fields, collection } from '@keystatic/core';
import { ROLES } from './src/consts';

export default config({
    storage: {
        kind: 'local',
    },
    collections: {
        // ハブ&スポーク構造のうち、ハブ ([slug]/index.mdx) のみ Keystatic で編集可能。
        // 章 ([slug]/*.mdx) は frontmatter が別スキーマ (chapter.*) のため MDX を直接編集する。
        projects: collection({
            label: '実績 (Projects)',
            slugField: 'title',
            path: 'src/content/projects/*/index',
            format: { contentField: 'content' }, // Maps MDX body to 'content' field
            schema: {
                title: fields.slug({ name: { label: 'プロジェクト名' } }),

                // 1. メタデータ
                meta: fields.object({
                    thumbnail: fields.image({
                        label: 'サムネイル画像',
                        directory: 'src/assets/projects',
                        publicPath: '../../../assets/projects/',
                    }),
                    icon: fields.image({
                        label: 'アイコン画像 (正方形推奨・省略時はサムネイル使用)',
                        directory: 'src/assets/projects',
                        publicPath: '../../../assets/projects/',
                    }),
                    date: fields.date({ label: 'プロジェクト完了年月' }),
                    updatedDate: fields.date({ label: '最終更新日', description: '更新一覧に表示される日時' }),
                    duration: fields.text({ label: '制作期間 (例: 3ヶ月)' }),
                    link: fields.url({ label: 'プロジェクトURL (任意)' }),
                }, { label: '基本情報' }),

                // 2. タグ・属性
                attributes: fields.object({
                    roles: fields.multiselect({
                        label: '担当した役割',
                        options: ROLES,
                    }),
                    stack: fields.array(
                        fields.text({ label: '技術・ツール (例: Figma, React)' }),
                        { label: '使用技術スタック', itemLabel: props => props.value }
                    ),
                }, { label: '属性・スキル' }),

                // 3. 30秒サマリー (ハブページの Hero 直下に出る)
                summary: fields.object({
                    tagline: fields.text({ label: 'タグライン (一言)' }),
                    what: fields.text({ label: '何を作ったか', multiline: true }),
                    why: fields.text({ label: 'なぜ作ったか', multiline: true }),
                    now: fields.text({ label: '今どうなっているか', multiline: true }),
                }, { label: '30秒サマリー' }),

                // 4. 本文エディタ (MDX)
                content: fields.mdx({
                    label: 'プロジェクト概要本文 (なんで作ったか / いまの状況 / 学び)',
                    options: {
                        image: {
                            directory: 'src/assets/projects',
                            publicPath: '../../../assets/projects/',
                        },
                    },
                }),
            },
        }),
    },
});
