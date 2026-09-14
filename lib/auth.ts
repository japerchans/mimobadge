import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Session } from "@/types";
export const demoSession = (): Session => ({
  facilityId: "sakura",
  userId: "aoki",
  role: "caregiver",
  expires: Date.now() + 8 * 3600000,
});
function secret() {
  const key = process.env.SESSION_SECRET;
  if (!key || key.length < 32)
    throw new Error("Set SESSION_SECRET to at least 32 characters.");
  return key;
}
export function signSession(session: Session) {
  const body = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
export async function getSession(): Promise<Session | null> {
  if (
    process.env.NODE_ENV !== "production" &&
    !process.env.DEMO_ACCESS_CODE &&
    !process.env.DATABASE_URL
  )
    return demoSession();
  const value = (await cookies()).get("mimo-session")?.value;
  if (!value) return null;
  try {
    const [body, signature] = value.split(".");
    const expected = createHmac("sha256", secret())
      .update(body)
      .digest("base64url");
    if (
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      return null;
    const session = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as Session;
    return session.expires > Date.now() &&
      session.facilityId === "sakura" &&
      ["caregiver", "viewer"].includes(session.role)
      ? session
      : null;
  } catch {
    return null;
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    if (process.env.APP_ORIGIN)
      return origin === new URL(process.env.APP_ORIGIN).origin;
    // Next.js may normalize request.url to localhost in development. Host is
    // the browser's actual destination and cannot be set by cross-origin JS.
    const supplied = new URL(origin);
    return (
      supplied.host === request.headers.get("host") &&
      supplied.protocol === new URL(request.url).protocol
    );
  } catch {
    return false;
  }
}
