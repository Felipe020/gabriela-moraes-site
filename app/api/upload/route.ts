import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { authorized } from "../../../lib/admin-auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.json() as HandleUploadBody;
    const result = await handleUpload({ body, request,
      onBeforeGenerateToken: async (pathname) => {
        if (!await authorized(request)) throw new Error("Entre no painel para enviar imagens.");
        if (!/^media\/[0-9a-f-]{36}$/.test(pathname)) throw new Error("Endereço da imagem inválido.");
        return { allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"], maximumSizeInBytes: 15000000, addRandomSuffix: false, allowOverwrite: false, validUntil: Date.now() + 5 * 60 * 1000 };
      },
      onUploadCompleted: async () => {},
    });
    return Response.json(result);
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Falha no envio da imagem." }, { status: 400 }); }
}
