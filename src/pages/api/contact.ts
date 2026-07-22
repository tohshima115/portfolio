import type { APIRoute } from "astro";
import { env as cfEnv } from "cloudflare:workers";

// Cloudflare Pages 上で SSR (POST) を動かすため
export const prerender = false;

type ContactPayload = {
    name?: string;
    email?: string;
    message?: string;
    // honeypot
    company?: string;
};

const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const POST: APIRoute = async ({ request }) => {
    let body: ContactPayload;
    try {
        body = (await request.json()) as ContactPayload;
    } catch {
        return json({ ok: false, error: "Invalid JSON" }, 400);
    }

    // honeypot: ボットが company を埋めたら静かに成功扱い
    if (body.company && body.company.trim() !== "") {
        return json({ ok: true });
    }

    const name = (body.name ?? "").trim().slice(0, 100);
    const email = (body.email ?? "").trim();
    const message = (body.message ?? "").trim();

    if (!email || !isEmail(email)) {
        return json({ ok: false, error: "メールアドレスが正しくありません" }, 400);
    }
    if (!message || message.length < 5) {
        return json({ ok: false, error: "メッセージが短すぎます" }, 400);
    }
    if (message.length > 5000) {
        return json({ ok: false, error: "メッセージが長すぎます (5000文字まで)" }, 400);
    }

    // Astro v6 以降、Cloudflare の env は `cloudflare:workers` からの import で取得する
    // (Astro.locals.runtime.env は廃止)。ローカル import.meta.env はフォールバック。
    const env = cfEnv as unknown as Record<string, string | undefined>;
    const meta = import.meta.env as unknown as Record<string, string | undefined>;
    const apiKey: string | undefined = env.RESEND_API_KEY ?? meta.RESEND_API_KEY;
    const from: string =
        env.CONTACT_FROM_EMAIL ??
        meta.CONTACT_FROM_EMAIL ??
        "豊島昇悟 <noreply@toyoshima.dev>";
    const to: string =
        env.CONTACT_TO_EMAIL ??
        meta.CONTACT_TO_EMAIL ??
        "tohshima115@gmail.com";

    if (!apiKey) {
        return json(
            { ok: false, error: "サーバー側の設定が未完了です (RESEND_API_KEY 未設定)" },
            500,
        );
    }

    const notifySubject = `[Portfolio] ${name ? name : email} からのメッセージ`;
    const notifyText = [
        `From : ${name || "(no name)"} <${email}>`,
        `------`,
        message,
    ].join("\n");

    const thanksSubject = "お問い合わせありがとうございます";
    const thanksText = [
        `${name || "お問い合わせ"}様`,
        "",
        "この度はお問い合わせいただき誠にありがとうございます。",
        "内容を確認の上、改めてご連絡いたします。",
        "",
        "---",
        "以下、送信いただいた内容です。",
        message,
    ].join("\n");

    const sendMail = (payload: {
        from: string;
        to: string[];
        replyTo?: string;
        subject: string;
        text: string;
    }) =>
        fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: payload.from,
                to: payload.to,
                reply_to: payload.replyTo,
                subject: payload.subject,
                text: payload.text,
            }),
        });

    try {
        const notifyRes = await sendMail({
            from,
            to: [to],
            replyTo: email,
            subject: notifySubject,
            text: notifyText,
        });

        if (!notifyRes.ok) {
            const detail = await notifyRes.text();
            return json(
                { ok: false, error: "送信に失敗しました", detail: detail.slice(0, 500) },
                502,
            );
        }

        // サンクスメールの失敗は問い合わせ自体の失敗として扱わない
        await sendMail({
            from,
            to: [email],
            subject: thanksSubject,
            text: thanksText,
        }).catch(() => {});

        return json({ ok: true });
    } catch (e) {
        return json({ ok: false, error: "送信中にエラーが発生しました" }, 500);
    }
};
