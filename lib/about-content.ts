export interface AboutContent {
  name: string; city: string; subtitle: string; description: string[]; photo: string;
  degree: string; institution: string; educationPeriod: string; currentSemester: string; keywords: string[];
}
export function validAbout(value: unknown): value is AboutContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  const text = (value: unknown, max: number, required = false) => typeof value === "string" && value.length <= max && (!required || value.trim().length > 0);
  if (!["name", "city", "subtitle", "degree", "institution", "educationPeriod", "currentSemester"].every(key => text(item[key], 200, key === "name"))) return false;
  if (!Array.isArray(item.description) || !item.description.length || item.description.length > 12 || !item.description.every(line => text(line, 3000, true))) return false;
  if (!Array.isArray(item.keywords) || item.keywords.length > 16 || !item.keywords.every(word => text(word, 100, true))) return false;
  if (!text(item.photo, 1000, true) || /[<>"'\s]/.test(item.photo as string)) return false;
  const photo = item.photo as string;
  if (photo.startsWith("/")) return !photo.startsWith("//") && !photo.includes("\\");
  try { return new URL(photo).protocol === "https:"; } catch { return false; }
}
