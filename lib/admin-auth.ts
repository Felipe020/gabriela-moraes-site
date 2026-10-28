import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";

interface AdminSession { owner?: boolean; }
export function adminConfigured() { return (process.env.ADMIN_PASSWORD?.length || 0) >= 12; }
export async function adminSession() {
  if (!adminConfigured()) return null;
  return getIronSession<AdminSession>(await cookies(), {
    cookieName: "gm_admin_session",
    password: createHash("sha256").update("gabriela-moraes-session:" + process.env.ADMIN_PASSWORD).digest("hex"),
    ttl: 8 * 60 * 60,
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 8 * 60 * 60 },
  });
}
export async function isAdmin() { return (await adminSession())?.owner === true; }
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}
export async function authorized(request: Request) { return sameOrigin(request) && await isAdmin(); }
export function matchesPassword(value: string) {
  if (!adminConfigured()) return false;
  const digest = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(digest(value), digest(process.env.ADMIN_PASSWORD!));
}
