import { config, fields, collection } from '@keystatic/core';
import { ROLES } from './src/consts';

export default config({
    storage: {
        kind: 'local',
    },
    collections: {
        projects: collection({
            label: '実績 (Projects)',
            slugField: 'title',
            path: 'src/content/projects/*', // Removed trailing slash for file mode
            format: { contentField: 'content' }, // Maps MDX body to 'content' field
            schema: {
                title: fields.slug({ name: { label: 'プロジェクト名' } }),

                // 1. メタデータ
                meta: fields.object({
                    thumbnail: fields.image({
                        label: 'サムネイル画像',
                        directory: 'src/assets/projects',
                        publicPath: '../../assets/projects/',
                    }),
                    icon: fields.image({
                        label: 'アイコン画像 (正方形推奨・省略時はサムネイル使用)',
                        directory: 'src/assets/projects',
                        publicPath: '../../assets/projects/',
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

                // 3. 本文エディタ (MDX)
                content: fields.mdx({
                    label: 'プロジェクト詳細 (Context, Approach, Result...)',
                    options: {
                        image: {
                            directory: 'src/assets/projects',
                            publicPath: '../../assets/projects/',
                        },
                    },
                }),
            },
        }),
    },
});
