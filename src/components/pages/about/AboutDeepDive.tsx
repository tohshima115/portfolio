import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ModalKey = "history" | "skills" | "stance" | "bio";

interface ButtonDef {
    key: ModalKey;
    code: string;
    label: string;
    sub: string;
}

const buttons: ButtonDef[] = [
    {
        key: "history",
        code: "+ OPEN_HISTORY",
        label: "経歴 / Career Path",
        sub: "学歴・職歴・起業準備の2年",
    },
    {
        key: "skills",
        code: "+ OPEN_SKILLS",
        label: "技術スタック詳細",
        sub: "Production / Design / Product / Exploring",
    },
    {
        key: "stance",
        code: "+ OPEN_STANCE",
        label: "技術選定の流儀",
        sub: "Cloudflare 偏愛 / 引き出し / 採用見送り判断",
    },
    {
        key: "bio",
        code: "+ OPEN_BIO",
        label: "思想 / 自己語り",
        sub: "経営学部視点・思考の癖・起業準備で得たもの",
    },
];

export const AboutDeepDive: React.FC = () => {
    const [open, setOpen] = useState<ModalKey | null>(null);

    // Esc で閉じる
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(null);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // モーダル開放中は背景スクロールロック
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    const current = buttons.find((b) => b.key === open) ?? null;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {buttons.map((b) => (
                    <button
                        key={b.key}
                        onClick={() => setOpen(b.key)}
                        className="group relative border border-border bg-background/60 backdrop-blur-sm p-5 hover:border-accent/60 transition-colors text-left flex items-center justify-between"
                    >
                        <div>
                            <div className="font-mono text-[10px] text-accent tracking-widest uppercase mb-2">
                                [ {b.code} ]
                            </div>
                            <div className="text-base font-bold text-foreground">
                                {b.label}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {b.sub}
                            </div>
                        </div>
                        <svg
                            className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0 ml-3"
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
                    </button>
                ))}
            </div>

            <AnimatePresence>
                {open && current && (
                    <ModalShell
                        key={open}
                        code={current.code}
                        label={current.label}
                        onClose={() => setOpen(null)}
                    >
                        {open === "history" && <HistoryContent />}
                        {open === "skills" && <SkillsContent />}
                        {open === "stance" && <StanceContent />}
                        {open === "bio" && <BioContent />}
                    </ModalShell>
                )}
            </AnimatePresence>
        </>
    );
};

// ----------------------------------------------------------------------------
// ModalShell
// ----------------------------------------------------------------------------

interface ModalShellProps {
    code: string;
    label: string;
    onClose: () => void;
    children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({
    code,
    label,
    onClose,
    children,
}) => {
    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-modal-title"
        >
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
                onClick={onClose}
                aria-hidden="true"
            />
            <motion.div
                className="relative bg-background border border-accent/40 shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
                initial={{ scale: 0.96, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.97, y: 12, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Window header (PRTS terminal風) */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-5 md:px-8 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex gap-1.5 flex-shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                            <div className="w-1.5 h-1.5 rounded-full bg-border" />
                            <div className="w-1.5 h-1.5 rounded-full bg-border" />
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] uppercase truncate">
                            {code}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="font-mono text-[10px] text-muted-foreground hover:text-accent tracking-widest uppercase transition-colors"
                        aria-label="Close modal"
                    >
                        [ ESC ]
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 md:px-10 py-8 md:py-10">
                    <h2
                        id="about-modal-title"
                        className="text-2xl md:text-3xl font-bold mb-8 tracking-tight border-l-4 border-accent pl-4"
                    >
                        {label}
                    </h2>
                    {children}
                </div>
            </motion.div>
        </motion.div>
    );
};

// ----------------------------------------------------------------------------
// Modal Contents
// ----------------------------------------------------------------------------

const HistoryContent: React.FC = () => {
    const history = [
        {
            period: "2025.07 — 2026.06 (退職予定)",
            role: "デザイン事務所 (アルバイト)",
            body: "クライアントワーク10件を並行管理。並行して業務改善（PLダッシュボード / 金額入力自動化 / カレンダー・LINE 自動化）を自発的に実施。",
            active: true,
        },
        {
            period: "2026.01 — Present",
            role: "個人開発「AIChatClip」",
            body: "AIチャットの会話を Obsidian / Notion / Webhook へ自動同期するマルチサーフェス SaaS。Chrome / Firefox ストア公開済み、課金実装、有料ユーザー獲得。",
            active: true,
        },
        {
            period: "2024 — 2026.01",
            role: "社会起業チーム「Swept」 — デザイナー → 実装まで一気通貫",
            body: "3人チームに当初デザイナーとして参画。ロゴ・ブランド・名刺・Web の設計を担当する中で「自分の設計は自分で実装した方が速い」と判断し、Cursor 等の AI コーディングツール勃興期に乗って実装まで担当範囲を拡張。Phase 1 (旅行) でユーザーインタビューと撤退判断を経験、Phase 2 (愛着) で Web まで実装。方向性の違いから 2026 年 1 月に離脱。",
            active: false,
        },
        {
            period: "2023",
            role: "新卒入社・退職",
            body: "正社員として就職するも 3 ヶ月で退職。プロダクト開発を軸に置きたいという自分の指向が明確になった転換点。",
            active: false,
        },
        {
            period: "〜 2023",
            role: "東京理科大学 経営学部 卒業",
            body: "事業視点（課金検証を先にやる、PLダッシュボードを自発的に作る）の土台はこの学部時代に。",
            active: false,
        },
    ];

    return (
        <div className="relative border-l border-border ml-2 pl-8 py-2 space-y-10">
            {history.map((entry, i) => (
                <div key={i} className="relative">
                    <span
                        className={`absolute -left-[37px] top-2 w-3.5 h-3.5 rounded-full border-4 border-background ${entry.active ? "bg-accent" : "bg-muted-foreground/40"}`}
                    />
                    <span
                        className={`font-mono text-xs block mb-1 tracking-widest uppercase ${entry.active ? "text-accent" : "text-muted-foreground"}`}
                    >
                        {entry.period}
                    </span>
                    <h3 className="text-lg font-bold mb-2 tracking-tight">
                        {entry.role}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {entry.body}
                    </p>
                </div>
            ))}
        </div>
    );
};

type SubGroup = { label: string; items: string[] };
type SkillGroup = {
    label: string;
    sub: string;
    learning?: boolean;
    items?: string[];
    subgroups?: SubGroup[];
};

const SkillsContent: React.FC = () => {
    const groups: SkillGroup[] = [
        {
            label: "Engineering",
            sub: "実プロダクトで採用",
            subgroups: [
                {
                    label: "Languages",
                    items: ["TypeScript"],
                },
                {
                    label: "Frameworks",
                    items: [
                        "React",
                        "React Router v7",
                        "Astro",
                        "Hono",
                        "Tailwind CSS",
                    ],
                },
                {
                    label: "Cloudflare",
                    items: [
                        "Workers",
                        "D1",
                        "R2",
                        "Durable Objects",
                        "Workers AI",
                        "Zero Trust",
                    ],
                },
                {
                    label: "Platform / Surface",
                    items: [
                        "WXT (Browser Extension)",
                        "Obsidian Plugin API",
                    ],
                },
                {
                    label: "Libraries",
                    items: ["Better Auth", "Drizzle ORM"],
                },
                {
                    label: "Motion / Video",
                    items: ["Remotion"],
                },
            ],
        },
        {
            label: "Design",
            sub: "Visual / UI / Print",
            subgroups: [
                {
                    label: "Tools",
                    items: [
                        "Figma",
                        "Illustrator",
                        "Photoshop",
                        "Affinity",
                        "Canva",
                    ],
                },
                {
                    label: "Domain",
                    items: [
                        "UI Design",
                        "Visual Identity",
                        "Logo Design",
                        "DTP (印刷物入稿)",
                    ],
                },
            ],
        },
        {
            label: "Product",
            sub: "企画・検証・運用",
            items: [
                "プロダクト企画",
                "ユーザーテスト設計",
                "リーン仮説検証",
                "マーケティング戦略",
                "クライアントワーク20件並行管理",
            ],
        },
        {
            label: "Currently Exploring",
            sub: "学習・実験中",
            learning: true,
            items: [
                "Three.js / R3F",
                "GSAP",
                "ベクトルDB / RAG",
                "Cloudflare Containers",
                "Tauri",
            ],
        },
    ];

    const chipClass = (learning: boolean | undefined) =>
        learning
            ? "inline-block px-3 py-1.5 text-xs font-mono tracking-wide text-muted-foreground border border-dashed border-border"
            : "inline-block px-3 py-1.5 text-xs font-mono tracking-wide text-foreground border border-border bg-background/60";

    return (
        <div className="space-y-10">
            {groups.map((group) => (
                <div key={group.label}>
                    <div className="flex items-baseline gap-3 mb-4">
                        <h3 className="text-base font-bold tracking-tight">
                            {group.label}
                        </h3>
                        <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                            — {group.sub}
                        </span>
                    </div>

                    {group.items && (
                        <div className="flex flex-wrap gap-2">
                            {group.items.map((skill) => (
                                <span
                                    key={skill}
                                    className={chipClass(group.learning)}
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    )}

                    {group.subgroups && (
                        <div className="space-y-4">
                            {group.subgroups.map((sub) => (
                                <div
                                    key={sub.label}
                                    className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-2 md:gap-4 items-start"
                                >
                                    <div className="font-mono text-[10px] text-accent tracking-widest uppercase pt-2">
                                        {sub.label}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {sub.items.map((skill) => (
                                            <span
                                                key={skill}
                                                className={chipClass(group.learning)}
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const StanceContent: React.FC = () => {
    return (
        <div className="space-y-10 text-base text-foreground/90 leading-relaxed">
            {/* 軸 1 */}
            <section>
                <h3 className="text-lg font-bold mb-3 tracking-tight">
                    1. Cloudflare を使い倒す
                </h3>
                <p>
                    Cloudflare Workers / D1 / R2 / Durable Objects / Workers AI / Zero Trust を主戦場にしています。
                    <strong className="text-foreground">
                        ベンダーロックインを覚悟して寄せている
                    </strong>
                    というよりも、Cloudflare で書いたコードは他の環境にも比較的素直に移植できる構造になりやすい
                    ── 結果として、運用コスト・レイテンシ・1人運用の負荷といったスケールメリットを素直に取りに行ける、と判断して採用しています。
                </p>
            </section>

            {/* 軸 2 */}
            <section>
                <h3 className="text-lg font-bold mb-3 tracking-tight">
                    2. 新しいものはまず触る、ただし「引き出し」として
                </h3>
                <p>
                    新しいツール・技術が出ると <strong className="text-foreground">まず触ってみる</strong>
                    のが性質で、AI 時代の「毎週新しいものが出る」サイクルと噛み合っているのは正直ラッキーだと感じています。
                </p>
                <p className="mt-3">
                    ただし触ること自体が目的ではなく、
                    <strong className="text-foreground">
                        「困ったときに引き出しから取り出せる状態を作る」
                    </strong>
                    のが目的。仕事で採用するときは、そのとき本当に必要かを別軸で判断します。
                </p>
            </section>

            {/* 軸 3 */}
            <section>
                <h3 className="text-lg font-bold mb-3 tracking-tight">
                    3. 流行ってるからは入れない（採用見送りの実例）
                </h3>
                <p>
                    例: 2025〜2026 年に話題の <strong className="text-foreground">OpenClaw</strong>
                    （AIエージェントを自前マシンで動かし、メッセージングプラットフォーム経由でシェル / ブラウザ / ファイル操作を実行できるツール）。
                </p>
                <p className="mt-3">触ってみたうえでの判断は採用見送り。理由は3つ：</p>
                <ul className="mt-3 space-y-2 pl-4 border-l border-border">
                    <li className="text-sm">
                        <strong className="text-foreground">権限の広さ</strong>:
                        シェル実行を含む操作面が広く、認証トークン盗難やコマンド/プロンプトインジェクション系の脆弱性 (CVE-2026-25253 等) が報告されている。
                    </li>
                    <li className="text-sm">
                        <strong className="text-foreground">サプライチェーン汚染</strong>:
                        外部スキルマーケット (ClawHub) 経由で配布されるスキル 10,700 件のうち、約 820 件が悪意あるものと判定されている (2026 年初頭時点)。
                    </li>
                    <li className="text-sm">
                        <strong className="text-foreground">代替手段の存在</strong>:
                        やりたいことの大半は「メッセージング → Webhook → 既存スクリプト」の組み合わせで実装でき、わざわざこのリスクを背負う必要はないと判断。
                    </li>
                </ul>
                <p className="mt-4 text-sm text-muted-foreground">
                    Meta はじめ複数の主要企業が社内利用禁止に動いている事実も含め、「流行ってる + 自分の引き出しに増やす」と「実プロダクトに入れる」は別軸で考える、というのを意識的にやっています。
                </p>
            </section>
        </div>
    );
};

const BioContent: React.FC = () => {
    return (
        <div className="space-y-6 text-base text-foreground/90 leading-relaxed">
            <p>
                経営学部出身で、PL や事業構造の感覚を持つエンジニア / デザイナーです。プロダクトの判断軸は技術的な美しさよりも事業から逆算する感覚を優先しており ──
                AIChatClip は MVP 段階で <strong className="text-foreground">1,000 円の課金意思を確認してから</strong>
                実装着手、PL ダッシュボードも先輩の業務を見て自発的に提案・実装、と性格として一貫しています。
            </p>

            <p>
                キャリアの起点は <strong className="text-foreground">デザイナー</strong> です。Illustrator / Photoshop / Figma で UI とビジュアルを作るところから始まり、社会起業チーム「Swept」(3人) でプロダクトに参画したことを境に、
                <strong className="text-foreground">「自分の設計を自分で実装する」</strong>
                方向に舵を切りました。
            </p>

            <p>
                ちょうど Cursor をはじめとする AI コーディングツールが勃興した時期で、当時のクオリティは荒削りでしたが「これは行ける」という手応えを早めに掴めたのは大きかったと思います。Vercel + Next.js を経て、最終的に
                <strong className="text-foreground"> React Router v7 + Astro + Hono </strong>
                に落ち着くまでフレームワーク選定を実験しながらフロント〜バックを覚えていきました。フレームワーク選定の軸も「何が起きているか追える / 設計が見通せる」を優先しているのは、デザイン由来の自分にとって読みやすさが性に合っているからです。
            </p>

            <p>
                少人数チームで事業を回す経験を起点に、AI 進化で「1人で完結できる」幅が広がっていく流れにそのまま乗って、いまは個人開発（AIChatClip）に重心を置いています。
                <strong className="text-foreground">
                    「ガッツリのエンジニア」を演じるのではなく、デザイナー出身で実装まで自走できる人間として勝負したい
                </strong>
                ──というのが立ち位置です。
            </p>

            <p className="text-sm text-muted-foreground pt-3 border-t border-border">
                思考の癖として「制約の中で法則を見つけて最適解を探す」型を持っており、囲碁・統計・イラストの構図・プロダクト設計など、領域は違っても同じ姿勢を使い回しています。
            </p>
        </div>
    );
};

export default AboutDeepDive;
