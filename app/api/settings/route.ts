import { authorized } from "../../../lib/admin-auth";
import { validSettings } from "../../../lib/site-settings";
import { savePortfolio } from "../../../lib/portfolio-store";
export async function PUT(request: Request) {
  if (!await authorized(request)) return Response.json({ error: "Acesso restrito à proprietária." }, { status: 403 });
  let body: any;
  try { body = await request.json(); } catch { return Response.json({ error: "Dados inválidos." }, { status: 400 }); }
  if (!validSettings(body)) return Response.json({ error: "Confira os campos. Preencha os campos obrigatórios e use formatos válidos para ano, e-mail, telefone e links." }, { status: 400 });
  const fields = body.section === "tools" ? ["items"] : body.section === "experience" ? ["intro", "entries"] : body.section === "home" ? ["year", "featuredKind", "featuredSlug"] : ["name", "city", "email", "phone", "instagram", "linkedin"];
  const item = Object.fromEntries(fields.map(field => [field, body.value[field]]));
  try { await savePortfolio({ kind: "settings", slug: body.section, item, deleted: false }); }
  catch { return Response.json({ error: "Não foi possível salvar. Tente novamente." }, { status: 503 }); }
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
