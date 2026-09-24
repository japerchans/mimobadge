import type { Session } from "@/types";

export const demoSession = (): Session => ({
  facilityId: "sakura",
  userId: "aoki",
  role: "caregiver",
  expires: Date.now() + 8 * 3600000,
});

export async function getSession(): Promise<Session> {
  return demoSession();
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
