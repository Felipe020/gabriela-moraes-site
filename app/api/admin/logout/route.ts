import { adminSession, sameOrigin } from "../../../../lib/admin-auth";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Acesso não permitido.", { status: 403 });
  (await adminSession())?.destroy();
  return Response.redirect(new URL("/gerenciar", request.url), 303);
}
