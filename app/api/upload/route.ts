import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  if (!request.headers.get("oai-authenticated-user-id") || request.headers.get("oai-authenticated-user-email")?.toLowerCase() !== "gabrielasmoraes8@gmail.com") return Response.json({ error: "Acesso restrito à proprietária." }, { status: 403 });
  if (!env.BUCKET) return Response.json({ error: "Armazenamento indisponível." }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || file.size > 15_000_000 || file.size === 0) return Response.json({ error: "Use uma imagem JPG, PNG, WebP ou AVIF de até 15 MB." }, { status: 400 });
  const key = crypto.randomUUID();
  await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return Response.json({ url: `/api/media/${key}` });
}
