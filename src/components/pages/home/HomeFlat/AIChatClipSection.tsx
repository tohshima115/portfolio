const tldr = [
    { k: 'Role', v: '企画 / 設計 / UI / 実装 / 運用 / マーケまで 1 人で完結' },
    { k: 'Stack', v: 'Cloudflare Workers · D1 · Durable Objects · Workers AI · WXT · Obsidian' },
    { k: 'Status', v: 'Chrome / Firefox ストア公開 · 課金実装 · 有料ユーザー獲得' },
    { k: 'Highlight', v: '拡張機能 + Web + API + Obsidianプラグイン + Realtime 同期 のマルチサーフェス' },
];

export const AIChatClipSection: React.FC = () => {
    return (
        <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="relative w-[min(92vw,920px)]">
                <div className="border border-foreground/15 bg-background/70 backdrop-blur-2xl px-6 sm:px-10 py-8 sm:py-10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent">
                            + FLAGSHIP / 01
                        </span>
                        <span className="h-px flex-1 bg-border" />
                        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                            2026.01 — Ongoing
                        </span>
                    </div>

                    <div className="flex items-center gap-4 mb-5">
                        <img
                            src="/AIChatClip/favicon.svg"
                            alt="AIChatClip"
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg shadow-[0_4px_16px_-4px_rgba(0,0,0,0.3)]"
                        />
                        <div className="font-black tracking-tight text-2xl sm:text-3xl">
                            AIChatClip
                        </div>
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-[1.05] mb-4">
                        AI チャットを Obsidian に
                        <br />
                        自動同期する SaaS。
                    </h2>

                    <p className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-2xl mb-6">
                        Cloudflare のエッジで動く個人開発プロダクト。ブラウザ拡張で会話を取得し、Workers AI でタイトル / タグを生成、Durable Objects 経由の WebSocket で Obsidian にリアルタイム同期する。
                    </p>

                    <dl className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-x-6 gap-y-3 text-sm mb-8">
                        {tldr.map((row) => (
                            <div key={row.k} className="contents">
                                <dt className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground pt-1">
                                    {row.k}
                                </dt>
                                <dd className="text-foreground/85 leading-relaxed">
                                    {row.v}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    <div className="flex items-center gap-4">
                        <a
                            href="/projects/aichatclip"
                            className="group inline-flex items-center gap-2 px-5 h-10 bg-foreground text-background font-mono text-[10px] tracking-[0.3em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
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
                        </a>
                        <a
                            href="https://aichatclip.com"
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Visit Site ↗
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
