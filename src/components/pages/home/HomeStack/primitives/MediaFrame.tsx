import type { ImageMetadata } from 'astro';
import { GridLayer } from '../visuals/GridLayer';

// Works / Blog の「pin して中身だけクロスフェード」カードの共通見た目。
// video が無いプロジェクト/記事は poster 静止画、それも無ければ抽象パターンの
// プレースホルダーにフォールバックする (実写が用意でき次第 videoSrc を足すだけでよい構造)。
export type MediaFrameMedia =
    | { type: 'video'; poster: ImageMetadata; videoSrc?: string }
    | { type: 'image'; src: ImageMetadata }
    | { type: 'placeholder' };

export interface MediaFrameProps {
    media: MediaFrameMedia;
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
    /** GSAP がクロスフェード制御するための識別子 (data-media-id) */
    stageId: string;
}

export const MediaFrame: React.FC<MediaFrameProps> = ({
    media,
    eyebrow,
    title,
    description,
    ctaLabel,
    ctaHref,
    stageId,
}) => (
    <div
        data-media-stage
        data-media-id={stageId}
        className="absolute inset-0 flex items-center justify-center px-4 md:px-8"
        style={{ opacity: 0 }}
    >
        <div className="relative w-full max-w-5xl aspect-video border border-foreground/15 bg-background overflow-hidden">
            <MediaVisual media={media} />

            {/* 可読性確保用の下方向グラデーション + テキスト/CTAオーバーレイ */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-5 md:p-8 flex flex-col items-start gap-2 md:gap-3">
                <p className="font-mono text-2xs md:text-xs uppercase tracking-[0.4em] text-white/70">
                    <span className="text-accent">+</span>
                    <span className="ml-3">{eyebrow}</span>
                </p>
                <h3 className="font-sans font-black text-white text-[clamp(1.5rem,4vw,2.75rem)] leading-tight tracking-tight">
                    {title}
                </h3>
                <p className="font-sans text-xs md:text-sm text-white/80 leading-relaxed max-w-xl line-clamp-2 md:line-clamp-3">
                    {description}
                </p>
                <a
                    href={ctaHref}
                    className="mt-2 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white border border-white/30 px-4 py-2 hover:bg-white hover:text-background transition-colors"
                >
                    <span>{ctaLabel}</span>
                    <span aria-hidden>→</span>
                </a>
            </div>
        </div>
    </div>
);

export const MediaVisual: React.FC<{ media: MediaFrameMedia }> = ({ media }) => {
    if (media.type === 'video') {
        return (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
                className="absolute inset-0 w-full h-full object-cover"
                poster={media.poster.src}
                src={media.videoSrc}
                autoPlay={!!media.videoSrc}
                muted
                loop
                playsInline
            />
        );
    }
    if (media.type === 'image') {
        return (
            <img
                src={media.src.src}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover"
            />
        );
    }
    return (
        <div className="absolute inset-0 bg-foreground/[0.03]">
            <GridLayer size={24} opacity={0.08} fade />
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-3xs uppercase tracking-[0.4em] text-muted-foreground/40">
                    Preview
                </span>
            </div>
        </div>
    );
};
