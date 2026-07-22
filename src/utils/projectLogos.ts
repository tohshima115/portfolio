/**
 * プロジェクト slug → public/ 配下のブランドロゴの絶対 URL マップ。
 * `mark` は正方形向け、`horizontal` はヘッダーの横長ワードマーク向け。
 * ロゴが未配置のプロジェクトは undefined を返し、呼び出し側で
 * 既存のサムネ / イニシャル文字フォールバックを使う想定。
 */

export interface ProjectLogo {
    mark?: string;
    horizontal?: string;
    vertical?: string;
}

const LOGOS: Record<string, ProjectLogo> = {
    aichatclip: {
        mark: '/AIChatClip/favicon.svg',
    },
    swept: {
        mark: '/Swept/logoMark.svg',
        horizontal: '/Swept/logoHorizontal.svg',
        vertical: '/Swept/logoVertical.svg',
    },
    foclock: {
        mark: '/Foclock/logoMark.png',
    },
    'kodaira-walking-gomihiroi': {
        mark: '/working-de-gomihiroi/logo-mark.png',
    },
};

export const getProjectLogo = (slug: string): ProjectLogo | undefined =>
    LOGOS[slug];
