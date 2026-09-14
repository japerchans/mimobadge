import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { demoSession, signSession, sameOrigin } from "@/lib/auth";
const attempts = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  const bucket = attempts.get("login");
  if (bucket && bucket.until > Date.now() && bucket.count >= 10)
    return Response.json(
      { error: "Too many attempts. Try again in five minutes." },
      { status: 429 },
    );
  const form = await request.formData();
  const code = String(form.get("code") || "");
  const expected = process.env.DEMO_ACCESS_CODE;
  if (
    !expected ||
    Buffer.byteLength(code) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(code), Buffer.from(expected))
  ) {
    attempts.set("login", {
      count: bucket && bucket.until > Date.now() ? bucket.count + 1 : 1,
      until: Date.now() + 300000,
    });
    return Response.json(
      { error: "Invalid access code, or login is not configured." },
      { status: 401 },
    );
  }
  try {
    (await cookies()).set("mimo-session", signSession(demoSession()), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 28800,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Session secret is not configured." },
      { status: 503 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  (await cookies()).delete("mimo-session");
  return Response.json({ ok: true });
}
