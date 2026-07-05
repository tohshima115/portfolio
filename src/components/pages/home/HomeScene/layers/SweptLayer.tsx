import { motion, useTransform, type MotionValue } from 'framer-motion';
import { Button, MicroLabel } from '../../../../ui';

interface Props {
    progress: MotionValue<number>;
}

const tldr = [
    { k: 'Role', v: 'ロゴ / VI / 名刺 / Web デザイン → フロントエンド実装 → UX リサーチ' },
    { k: 'Phase 1', v: '旅行テーマで仮説検証 → 想定したペインに到達せず撤退判断' },
    { k: 'Phase 2', v: '愛着テーマで Web まで実装。Cursor 勃興期に AI 実装に乗る' },
    { k: 'Status', v: '2026.01 に方向性の違いから離脱（Web 運用は残メンバーで継続）' },
];

export const SweptLayer = ({ progress }: Props) => {
    // セクション 3 (Swept) は progress 0.6 中心。
    // 一度 fade in したら progress が増えても消えないように出し切りで止める
    // (上 scroll で 0.46 を下回ると再フェード → 再進入で再発火)。
    const opacity = useTransform(progress, [0.46, 0.56], [0, 1]);
    const yOffset = useTransform(progress, [0.46, 0.6], [40, 0]);
    // backdrop-filter は見えていない区間で none にして合成コストを抑える。
    const cardBackdrop = useTransform(opacity, (o) =>
        o > 0.05 ? 'blur(24px)' : 'none',
    );

    return (
        <motion.div
            style={{ opacity, y: yOffset }}
            className="relative w-[min(92vw,920px)] pointer-events-auto"
        >
            <motion.div
                style={{ backdropFilter: cardBackdrop, WebkitBackdropFilter: cardBackdrop }}
                className="border border-foreground/15 bg-background/70 px-6 sm:px-10 py-8 sm:py-10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]"
            >
                <div className="flex items-center gap-3 mb-6">
                    <MicroLabel className="text-accent">+ DESIGN ROOTS / 03</MicroLabel>
                    <span className="h-px flex-1 bg-border" />
                    <MicroLabel>2024 — 2026.01 / 約 2 年</MicroLabel>
                </div>

                <div className="mb-5">
                    <img
                        src="/Swept/logoHorizontal.svg"
                        alt="Swept"
                        width={200}
                        height={80}
                        className="h-12 sm:h-14 w-auto"
                    />
                </div>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-[1.05] mb-4">
                    デザイナー起点の約 2 年。
                    <br />
                    自分にとっての転換点。
                </h2>

                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-2xl mb-6">
                    3 人チームの社会起業プロジェクト。ロゴ・ブランド・名刺・Web を一気通貫で担当する中で「自分の設計は自分で実装した方が速い」と判断し、AI コーディングツール勃興期に乗ってフロント実装まで広げた。<strong className="text-foreground">デザイナー → Product Engineer への転換点</strong>。
                </p>

                <dl className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-x-6 gap-y-3 text-sm mb-8">
                    {tldr.map((row) => (
                        <div key={row.k} className="contents">
                            <dt className="font-mono text-2xs tracking-[0.25em] uppercase text-muted-foreground pt-1">
                                {row.k}
                            </dt>
                            <dd className="text-foreground/85 leading-relaxed">
                                {row.v}
                            </dd>
                        </div>
                    ))}
                </dl>

                <div className="flex items-center gap-4">
                    <Button as="a" href="/projects/swept" variant="primary" size="md">
                        Open Case Study
                        <svg
                            className="w-3 h-3 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                        </svg>
                    </Button>
                    <MicroLabel as="a" href="/projects">
                        All Projects →
                    </MicroLabel>
                </div>
            </motion.div>
        </motion.div>
    );
};
