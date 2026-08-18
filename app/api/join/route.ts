import { NextResponse } from "next/server";

// newsletter signup → emailjs
//  - service_7ryyk2d          the mail service
//  - template_m2an2mn         auto-reply to the subscriber (email-templates/autoreply.html)
//  - template_k4an26          subscriber record to the owner   (email-templates/notify.html)
// set EMAILJS_PUBLIC_KEY (and the owner inbox) to go live; until then
// the endpoint accepts the signup and queues nothing, like before.

const SERVICE_ID = process.env.EMAILJS_SERVICE_ID ?? "service_7ryyk2d";
const REPLY_TEMPLATE = process.env.EMAILJS_TEMPLATE_REPLY ?? "template_m2an2mn";
const NOTIFY_TEMPLATE = process.env.EMAILJS_TEMPLATE_NOTIFY ?? "template_k4an26";
const OWNER_EMAIL = process.env.EMAILJS_OWNER_EMAIL;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendEmail(templateId: string, params: Record<string, string>) {
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  if (!publicKey) return { ok: true, skipped: true };
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: templateId,
      user_id: publicKey,
      template_params: params,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("emailjs send failed", templateId, res.status, text);
  }
  return { ok: res.ok, status: res.status };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "bad email" }, { status: 400 });
  }

  const common = {
    email,
    date: new Date().toISOString().slice(0, 16).replace("T", " "),
  };
  const results = await Promise.all([
    sendEmail(REPLY_TEMPLATE, { ...common, to_email: email }),
    OWNER_EMAIL
      ? sendEmail(NOTIFY_TEMPLATE, { ...common, to_email: OWNER_EMAIL })
      : Promise.resolve({ ok: true, skipped: true }),
  ]);

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    return NextResponse.json({ ok: false, error: "email failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}