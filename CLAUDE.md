# CLAUDE.md — このリポジトリ固有の運用メモ

将来の自分（と AI エージェント）が同じ落とし穴にハマらないための備忘録。

## サムネイル動画（Works 一覧 / トップの Works セクション）

Works の詳細ハブと一覧、トップページの Works セクションでは、サムネイルに **WebM 動画**をループ再生できる。

- 一覧・詳細: `src/content/projects/<slug>/index.mdx` の `meta.thumbnailVideo`（`public/` 配下のパス文字列。例 `/works/swept-hero.webm`）
- トップ: `src/components/pages/home/HomeStack/sections/works/data.ts` の `videoSrc`
- 描画: いずれも **`autoPlay` 任せにせず、アクティブなカードの動画だけを ref 経由で `play()`** している
  （`WorksExplorer.tsx` の `WorkVisual` / `WorksSection.tsx` の `playOnlyActiveVideo`）。
  全カードの動画を同時に読み込ませない＆自動再生ポリシーのブロックを避けるため。非アクティブは `pause()` + `preload="none"`。

### ⚠️ 一番ハマった罠: Remotion 出力の WebM がブラウザで再生されない

AIChatClip・こだいらつながりフェスのサムネイル動画は、兄弟プロジェクトの **Remotion** で作った映像を書き出したもの。
この Remotion 由来の WebM が、**`<video>` には埋め込まれるのに Chrome で再生されない**という症状を起こした。

**原因**: Remotion 出力の WebM が異例のカラーメタデータを持っていた。

| | color_range | color_space | 結果 |
|---|---|---|---|
| Swept（自分で ffmpeg 変換） | tv (limited) | unknown | ✅ 再生される |
| Remotion 由来（変換前） | **pc (full)** | **bt470bg** | ❌ 再生されない |

`bt470bg`（PAL 用の古い色空間）+ フルレンジという Web では異例のタグを Chrome の VP9 デコード/描画が扱えず、
無音・解像度・コーデックを Swept と揃えても**色タグだけが違うと再生されなかった**。

**切り分けで分かったこと（＝ここは疑わなくてよい）**:
- 動画ファイル自体は正常（`ffprobe` OK）、dev サーバーの配信も正常（200/206・Range 対応）、ブラウザ `fetch()` でも全バイト取得できる
- SSR HTML の `<video>` タグも `autoPlay muted loop playsInline` すべて正しく出ている
- → **ネットワークでもコードでもなく、動画のカラーメタデータが原因**だった

**診断コマンド**（色タグを見る）:
```bash
ffprobe -v error -show_entries stream=codec_name,pix_fmt,color_range,color_space,color_primaries,color_transfer \
  -of default=noprint_wrappers=1 path/to/video.webm
```

**解決レシピ**: Web 標準の **bt709 / limited(tv)** に実変換して正規化する。ついでに音声も落として軽量化。
```bash
ffmpeg -y -i INPUT.webm -an \
  -vf "scale=1280:-2:in_range=full:out_range=tv,format=yuv420p" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  OUTPUT.webm
```
- `-an`: 音声トラックを削除（`muted` 自動再生でも、音声トラックありは環境依存で不安定になり得るので落とす）
- `scale=1280:-2`: サムネイル用途なら 1280px 幅で十分。51MB → 1MB 前後まで軽くなる
- 一番効いたのは **`in_range=full:out_range=tv` + `-colorspace bt709`**（＝ `bt470bg`/full タグの解消）

> 根本を直すなら Remotion 側の書き出し設定で色空間を bt709 にするのが理想。ただし上の ffmpeg 後処理で十分実用になる。

## 動作確認の注意

- **自動操作 Chrome（claude-in-chrome ツール）は動画を一切デコードできない**ことがある（h264 mp4 すら `readyState:0` でストール）。
  動画再生の目視確認はこのツールでは当てにできない。**実ブラウザで確認**すること。
- dev は Astro + `@astrojs/cloudflare` アダプター。静的アセット配信は正常だが、上記の自動操作 Chrome 制約と併せて
  「動画が出ない」ときはまず **実ブラウザ + ハードリロード（Ctrl+Shift+R）** で切り分ける。

## ffmpeg / ffprobe の場所

PATH に入っていない。winget 版の実体はここ:
```
C:/Users/tohsh/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/
```
（`ffmpeg.exe` / `ffprobe.exe`）
