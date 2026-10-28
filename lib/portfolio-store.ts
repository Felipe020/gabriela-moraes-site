import { get, list, put } from "@vercel/blob";
export type PortfolioRecord = { kind: string; slug: string; item: Record<string, unknown>; deleted: boolean; updatedAt?: string };
export function storageConfigured() { return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID); }
export async function readPortfolio(): Promise<PortfolioRecord[]> {
  if (!storageConfigured()) throw new Error("Armazenamento do portfólio não configurado.");
  const records: PortfolioRecord[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "portfolio/", limit: 1000, cursor });
    const items = await Promise.all(page.blobs.map(async (blob) => {
      const file = await get(blob.pathname, { access: "private", useCache: false });
      if (!file || file.statusCode !== 200) throw new Error("Não foi possível ler um projeto salvo.");
      return new Response(file.stream).json() as Promise<PortfolioRecord>;
    }));
    records.push(...items);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return records.sort((a, b) => (a.updatedAt || "").localeCompare(b.updatedAt || ""));
}
export async function savePortfolio(record: PortfolioRecord) {
  if (!storageConfigured()) throw new Error("Armazenamento do portfólio não configurado.");
  await put(`portfolio/${record.kind}/${record.slug}.json`, JSON.stringify({ ...record, updatedAt: new Date().toISOString() }), {
    access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60,
  });
}
