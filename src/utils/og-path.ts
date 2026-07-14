/**
 * ページのパス → そのページの OGP 画像 URL。
 * 実体は `src/pages/og/[...path].png.ts` がビルド時に生成する静的 PNG。
 * 生成側の列挙とこの規則がズレると 404 になるので、両方セットで直すこと。
 */
export function ogImagePath(pathname: string): string {
    const trimmed = pathname.replace(/\/+$/, '');
    return trimmed === '' ? '/og/index.png' : `/og${trimmed}.png`;
}
