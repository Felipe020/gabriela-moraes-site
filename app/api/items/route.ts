import { authorized } from "../../../lib/admin-auth";
import { readPortfolio, savePortfolio } from "../../../lib/portfolio-store";

export const dynamic = "force-dynamic";
const ownerEmail = "gabrielasmoraes8@gmail.com";
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });

function validText(value: unknown, max = 3000) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max && !/[<>\"]/.test(value);
}

function validUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 1000 || /[<>\"]/.test(value)) return false;
  if (value.startsWith("/")) return !value.startsWith("//");
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function validDrawing(image: any) {
  return image && validUrl(image.src) && validText(image.label, 160)
    && (image.displayWidth === undefined || (Number.isInteger(image.displayWidth) && image.displayWidth >= 30 && image.displayWidth <= 100))
    && (image.displayScale === undefined || (Number.isInteger(image.displayScale) && image.displayScale >= 10 && image.displayScale <= 300));
}

function validate(body: any) {
  if (!body || !["project", "other"].includes(body.kind) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug || "")) return false;
  const item = body.item;
  if (!item || item.slug !== body.slug || !validText(item.title, 160) || !Array.isArray(item.images) || item.images.length > 60) return false;
  if (!item.images.every((image: any) => image && validUrl(image.src) && (!image.label || validText(image.label, 160)))) return false;
  if (body.kind === "project") {
    return validText(item.category, 160) && validUrl(item.cover) && (!item.year || validText(item.year, 30)) && (!item.location || validText(item.location, 160)) && (!item.discipline || validText(item.discipline, 160)) && (!item.renderSoftware || validText(item.renderSoftware, 160)) && (!item.diagramSoftware || validText(item.diagramSoftware, 160)) && (!item.photoSoftware || validText(item.photoSoftware, 160)) && Array.isArray(item.description) && item.description.length <= 12 && item.description.every((x: unknown) => validText(x)) && Array.isArray(item.plans) && item.plans.length <= 30 && item.plans.every(validDrawing) && (item.diagrams === undefined || (Array.isArray(item.diagrams) && item.diagrams.length <= 30 && item.diagrams.every(validDrawing)));
  }
  return validText(item.tool, 100) && (item.category === undefined || item.category === "" || validText(item.category, 160)) && (!item.cover || validUrl(item.cover)) && (!item.year || validText(item.year, 30)) && (!item.location || validText(item.location, 160)) && (!item.discipline || validText(item.discipline, 160)) && (!item.renderSoftware || validText(item.renderSoftware, 160)) && (!item.diagramSoftware || validText(item.diagramSoftware, 160)) && (!item.photoSoftware || validText(item.photoSoftware, 160)) && (item.description === undefined || (typeof item.description === "string" && item.description.length <= 5000)) && (item.plans === undefined || (Array.isArray(item.plans) && item.plans.length <= 60 && item.plans.every(validDrawing))) && (item.diagrams === undefined || (Array.isArray(item.diagrams) && item.diagrams.length <= 30 && item.diagrams.every(validDrawing))) && item.images.length > 0 && (item.executiveImages === undefined || (Array.isArray(item.executiveImages) && item.executiveImages.length <= 60 && item.executiveImages.every((image: any) => image && validUrl(image.src) && (!image.label || validText(image.label, 160)))));
}

export async function GET() {
  try { return json({ items: await readPortfolio() }); } catch { return json({ error: "Não foi possível carregar os projetos salvos." }, 503); }
}

export async function PUT(request: Request) {
  if (!await authorized(request)) return json({ error: "Acesso restrito à proprietária." }, 403);
  let body: any;
  try { body = await request.json(); } catch { return json({ error: "Dados inválidos." }, 400); }
  if (!validate(body)) return json({ error: "Confira os campos e imagens do projeto." }, 400);
  try { await savePortfolio({ kind: body.kind, slug: body.slug, item: body.item, deleted: false }); } catch { return json({ error: "Não foi possível salvar. Suas alterações não foram gravadas." }, 503); }
  return json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!await authorized(request)) return json({ error: "Acesso restrito à proprietária." }, 403);
  let body: any;
  try { body = await request.json(); } catch { return json({ error: "Dados inválidos." }, 400); }
  if (!["project", "other"].includes(body?.kind) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body?.slug || "")) return json({ error: "Projeto inválido." }, 400);
  try { await savePortfolio({ kind: body.kind, slug: body.slug, item: {}, deleted: true }); } catch { return json({ error: "Não foi possível excluir o projeto." }, 503); }
  return json({ ok: true });
}
