import { authorized } from "../../../lib/admin-auth";
import { validAbout } from "../../../lib/about-content";
import { savePortfolio } from "../../../lib/portfolio-store";
export async function PUT(request: Request) {
  if (!await authorized(request)) return Response.json({ error: "Acesso restrito à proprietária." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Dados inválidos." }, { status: 400 }); }
  if (!validAbout(body)) return Response.json({ error: "Confira o nome, o texto e a foto de apresentação." }, { status: 400 });
  try { await savePortfolio({ kind: "about", slug: "profile", item: { ...body }, deleted: false }); }
  catch { return Response.json({ error: "Não foi possível salvar o Sobre mim. Tente novamente." }, { status: 503 }); }
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
