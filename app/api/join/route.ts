import { NextResponse } from "next/server";

// stub: no real backend yet. drop the address in a queue when infra exists.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "bad email" }, { status: 400 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}