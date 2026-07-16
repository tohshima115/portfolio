import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { SectionFrame } from '../visuals/SectionFrame';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { CONTACT, xUrl } from '@/consts';

// トップページ末尾のコンタクト。以前は /contact へ誘導するだけの CTA だったが、
// 「ここで直接送れる」方が導線が短いので、フォーム本体をそのまま埋め込む。
// 見た目は同心円/スキャンライン等の独自演出をやめ、About セクションと同じ
// 「SectionFrame + 中央見出し (大きな Contact ワードマーク)」に揃えて統一感を出す。
// 高さも 100vh を取らず、中身に合わせた自然な py にする。

type Tone = 'idle' | 'ok' | 'error';

const toneClass: Record<Tone, string> = {
    idle: 'text-muted-foreground',
    ok: 'text-accent',
    error: 'text-red-500',
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const inputClass =
    'w-full bg-background/60 border border-border focus:border-accent focus:outline-none px-4 py-3 text-base transition-colors';
const labelClass =
    'block font-mono text-2xs text-muted-foreground tracking-widest uppercase mb-2';

export const CTASection: React.FC = () => {
    const ref = useRef<HTMLElement>(null);
    const reduced = useReducedMotion();
    const inView = useInView(ref, { once: true, amount: 0.25 });
    const x = xUrl();

    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ text: string; tone: Tone }>({
        text: '',
        tone: 'idle',
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const payload = {
            name: String(fd.get('name') ?? ''),
            email: String(fd.get('email') ?? '').trim(),
            message: String(fd.get('message') ?? '').trim(),
            company: String(fd.get('company') ?? ''), // honeypot
        };

        if (!payload.email || !isEmail(payload.email)) {
            setStatus({ text: 'メールアドレスを確認してください。', tone: 'error' });
            return;
        }
        if (!payload.message) {
            setStatus({ text: '本文を入力してください。', tone: 'error' });
            return;
        }

        setSending(true);
        setStatus({ text: '送信中...', tone: 'idle' });

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = (await res.json()) as { ok: boolean; error?: string };
            if (res.ok && data.ok) {
                setStatus({
                    text: '送信しました。ありがとうございます！',
                    tone: 'ok',
                });
                form.reset();
            } else {
                setStatus({
                    text:
                        data.error ??
                        '送信に失敗しました。時間をおいて再度お試しください。',
                    tone: 'error',
                });
            }
        } catch {
            setStatus({
                text: 'ネットワークエラーで送信できませんでした。',
                tone: 'error',
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <section
            ref={ref}
            data-section="contact"
            className="relative w-full bg-background overflow-hidden"
        >
            <div className="relative w-full py-20 md:py-28">
                <SectionFrame inset={32} />

                <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-12">
                    {/* Header */}
                    <motion.div
                        initial={reduced ? false : { opacity: 0, y: 16 }}
                        animate={
                            inView || reduced
                                ? { opacity: 1, y: 0 }
                                : { opacity: 0, y: 16 }
                        }
                        transition={{ duration: 0.7, delay: 0.05 }}
                        className="text-center mb-12 md:mb-14"
                    >
                        <p className="font-mono text-2xs text-accent tracking-[0.3em] uppercase mb-4">
                            + SAY_HELLO
                        </p>
                        <span className="block font-sans font-black uppercase tracking-tight text-foreground/90 text-[clamp(2rem,10svh,3.5rem)] md:text-[clamp(2.75rem,7vw,5.5rem)] leading-none">
                            Contact
                        </span>
                        <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
                            お仕事の話でも、ちょっとした雑談でも、遊びのお誘いでも。
                            返信できるとは限りませんが、ぜんぶ読みます。
                        </p>
                    </motion.div>

                    {/* Form */}
                    <motion.form
                        onSubmit={handleSubmit}
                        noValidate
                        initial={reduced ? false : { opacity: 0, y: 20 }}
                        animate={
                            inView || reduced
                                ? { opacity: 1, y: 0 }
                                : { opacity: 0, y: 20 }
                        }
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="space-y-5"
                    >
                        {/* honeypot */}
                        <div className="hidden" aria-hidden>
                            <label>
                                Company
                                <input
                                    type="text"
                                    name="company"
                                    autoComplete="off"
                                    tabIndex={-1}
                                />
                            </label>
                        </div>

                        <div>
                            <label htmlFor="cta-name" className={labelClass}>
                                Name <span className="text-border">(optional)</span>
                            </label>
                            <input
                                id="cta-name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                maxLength={100}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label htmlFor="cta-email" className={labelClass}>
                                Email
                            </label>
                            <input
                                id="cta-email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label htmlFor="cta-message" className={labelClass}>
                                Message
                            </label>
                            <textarea
                                id="cta-message"
                                name="message"
                                rows={6}
                                required
                                maxLength={5000}
                                className={`${inputClass} leading-relaxed resize-y`}
                            />
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <button
                                type="submit"
                                disabled={sending}
                                className="group inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-mono text-xs tracking-widest uppercase hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{sending ? 'Sending...' : 'Send'}</span>
                                <svg
                                    className="w-3 h-3 group-hover:translate-x-1 transition-transform"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    aria-hidden
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                                    />
                                </svg>
                            </button>
                            <p
                                className={`font-mono text-xs ${toneClass[status.tone]}`}
                                aria-live="polite"
                            >
                                {status.text}
                            </p>
                        </div>
                    </motion.form>

                    {/* Elsewhere */}
                    <motion.div
                        initial={reduced ? false : { opacity: 0 }}
                        animate={inView || reduced ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs tracking-[0.2em] text-muted-foreground"
                    >
                        <a
                            href={CONTACT.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground transition-colors"
                        >
                            GITHUB ↗
                        </a>
                        {x && (
                            <>
                                <span className="text-muted-foreground/30">/</span>
                                <a
                                    href={x}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-foreground transition-colors"
                                >
                                    X ↗
                                </a>
                            </>
                        )}
                        <span className="text-muted-foreground/30">/</span>
                        <a
                            href={`mailto:${CONTACT.email}`}
                            className="hover:text-foreground transition-colors"
                        >
                            EMAIL
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
