import { get } from "@vercel/blob";
export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  if (!/^[0-9a-f-]{36}$/.test(key)) return new Response("Not found", { status: 404 });
  const file = await get(`media/${key}`, { access: "private" });
  if (!file || file.statusCode !== 200) return new Response("Not found", { status: 404 });
  return new Response(file.stream, { headers: { "Content-Type": file.blob.contentType || "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
}
