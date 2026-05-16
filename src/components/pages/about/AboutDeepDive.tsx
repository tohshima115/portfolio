import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ModalKey = "history" | "bio";

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
        key: "bio",
        code: "+ OPEN_BIO",
        label: "もう少し詳しい自己紹介",
        sub: "どんな人間か / 大事にしてる感覚 / 作業スタイル",
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
            period: "2026.01 — Present",
            role: "個人開発「AIChatClip」",
            body: "AI チャットの会話をクリップしたくて作りました。Chrome / Firefox 拡張と Web + API の SaaS として公開中です。",
            active: true,
        },
        {
            period: "2025.07 — Present",
            role: "デザイン事務所",
            body: "デザインと実装のクライアントワークを担当しています。最初はデザインだけでしたが、自分の設計を自分で実装した方が速いと気づいてから、環境の構成ごと引き受けるようになりました。",
            active: true,
        },
        {
            period: "2024 — 2026.01",
            role: "社会起業チーム「Swept」",
            body: "3人チームにデザイナーとして入りました。ロゴや UI を作りながら、自分の設計を自分でかたちにしたくなって実装まで手を伸ばしました。ちょうど Cursor が出てきた時期で、タイミングが良かったです。方向性の違いから 2026 年 1 月に離れました。",
            active: false,
        },
        {
            period: "〜 2023",
            role: "東京理科大学 経営学部 卒業",
            body: "統計学専攻でした。授業よりも囲碁部の活動に力を入れていた記憶の方が強いです。",
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

const BioContent: React.FC = () => {
    return (
        <div className="space-y-6 text-base text-foreground/90 leading-relaxed">
            <p>
                行き当たりばったりな人間です。思いつきでバッと動いて、毎回どこか変な場所にいます。大学を卒業してから好き勝手やるようにしていったら、気づいたら社会のレールからだいぶ外れていました。ただ、衝動のままに動いているときが一番前に進める気がしているので、これからもたぶんそうしていくと思います。
            </p>

            <p>
                キャリアはデザイナーで始まりました。Figma / Illustrator で UI やビジュアルを作るところから入って、「自分の設計を自分でかたちにしたい」と思って実装まで手を伸ばしました。ちょうど Cursor が出てきた時期で、タイミングが良かったです。
            </p>

            <p>
                Cloudflare に出会ってからはほぼ手癖で選んでいます。D1 を最初に触ったとき「むず」と思いましたが、慣れたら「めっちゃ便利」に変わりました。お金をかけずに何でも実験できる感じが好きで、Discord コミュニティでリリースを追いながら少しずつ知識を広げています。
            </p>

            <p className="pt-3 border-t border-border">
                こだわりは「ちょうどいい、ジャストフィット」を探すこと。最高スペックを買うのではなく、自分の要求水準にぴったりのものを選ぶ感覚です。キーボードも入力配列もツールも、全部この感覚で選んでいます。買ったけど使っていないものがほぼないのはそのおかげだと思っています。
            </p>

            <p>
                作業は一人でやる方が好きです。通話しながら作業しようとすると通話に集中してしまって何も進まないので、通話するときは最初から「今日は雑談の時間」と決めています。
            </p>
        </div>
    );
};

export default AboutDeepDive;
