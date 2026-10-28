import { adminConfigured, adminSession, matchesPassword, sameOrigin } from "../../../../lib/admin-auth";
export const runtime = "nodejs";
const attempts = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Acesso não permitido.", { status: 403 });
  if (!adminConfigured()) return new Response("Configure ADMIN_PASSWORD na hospedagem com pelo menos 12 caracteres.", { status: 503 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  const attempt = attempts.get(ip);
  if (attempt && attempt.until > now && attempt.count >= 10) return new Response("Muitas tentativas. Tente novamente em 15 minutos.", { status: 429, headers: { "Retry-After": "900" } });
  const data = await request.formData();
  const password = data.get("password");
  if (typeof password !== "string" || password.length > 1024 || !matchesPassword(password)) {
    const entry = attempt && attempt.until > now ? attempt : { count: 0, until: now + 900000 };
    entry.count++; attempts.set(ip, entry);
    if (attempts.size > 10000) for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
    await new Promise(resolve => setTimeout(resolve, 800));
    return Response.redirect(new URL("/gerenciar?error=senha", request.url), 303);
  }
  attempts.delete(ip);
  const session = await adminSession();
  if (!session) return new Response("Login indisponível.", { status: 503 });
  session.owner = true;
  await session.save();
  return Response.redirect(new URL("/gerenciar", request.url), 303);
}
