import { upload } from "@vercel/blob/client";
export async function uploadImage(file) {
  const key = crypto.randomUUID();
  await upload(`media/${key}`, file, { access: "private", handleUploadUrl: "/api/upload", multipart: file.size > 4000000, contentType: file.type });
  return `/api/media/${key}`;
}
