import { authorized } from "../../../lib/admin-auth";
import { savePortfolio } from "../../../lib/portfolio-store";
export async function PUT(request: Request) {
  if (!await authorized(request)) return Response.json({ error: "Acesso restrito à proprietária." }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Dados inválidos." }, { status: 400 }); }
  if (!body || !["project", "other"].includes(body.kind) || !Array.isArray(body.slugs) || body.slugs.length > 300 || new Set(body.slugs).size !== body.slugs.length || !body.slugs.every((slug: unknown) => typeof slug === "string" && slug.length <= 160 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
    return Response.json({ error: "Confira a lista de projetos." }, { status: 400 });
  }
  try { await savePortfolio({ kind: "order", slug: body.kind, item: { slugs: body.slugs }, deleted: false }); }
  catch { return Response.json({ error: "Não foi possível salvar a ordem. Tente novamente." }, { status: 503 }); }
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
