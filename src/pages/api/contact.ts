import type { APIRoute } from "astro";

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

export const POST: APIRoute = async ({ request, locals }) => {
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

    // Cloudflare runtime env もしくはローカル import.meta.env から取得
    const env = (locals as any)?.runtime?.env ?? {};
    const meta = import.meta.env as unknown as Record<string, string | undefined>;
    const apiKey: string | undefined = env.RESEND_API_KEY ?? meta.RESEND_API_KEY;
    const from: string =
        env.CONTACT_FROM_EMAIL ??
        meta.CONTACT_FROM_EMAIL ??
        "Portfolio Contact <onboarding@resend.dev>";
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

    const subject = `[Portfolio] ${name ? name : email} からのメッセージ`;
    const text = [
        `From : ${name || "(no name)"} <${email}>`,
        `------`,
        message,
    ].join("\n");

    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from,
                to: [to],
                reply_to: email,
                subject,
                text,
            }),
        });

        if (!res.ok) {
            const detail = await res.text();
            return json(
                { ok: false, error: "送信に失敗しました", detail: detail.slice(0, 500) },
                502,
            );
        }
        return json({ ok: true });
    } catch (e) {
        return json({ ok: false, error: "送信中にエラーが発生しました" }, 500);
    }
};
