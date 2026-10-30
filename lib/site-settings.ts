export function validSettings(body: any) {
  const value = body?.value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (body.section === "home") return typeof value.year === "string" && /^\d{4}$/.test(value.year) && ["project", "other"].includes(value.featuredKind) && typeof value.featuredSlug === "string" && value.featuredSlug.length <= 160 && (value.featuredSlug === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.featuredSlug));
  if (body.section === "tools") return Array.isArray(value.items) && value.items.length <= 40 && value.items.every((item: unknown) => typeof item === "string" && item.trim().length > 0 && item.length <= 100);
  if (body.section === "experience") {
    return typeof value.intro === "string" && value.intro.length <= 600 && Array.isArray(value.entries) && value.entries.length <= 40 && value.entries.every((entry: any) => entry && typeof entry === "object" && ["period", "studio", "role"].every(key => typeof entry[key] === "string" && entry[key].trim().length > 0 && entry[key].length <= (key === "period" ? 80 : 200)));
  }
  if (body.section !== "contact") return false;
  const text = (v: unknown, max: number) => typeof v === "string" && v.length <= max;
  if (!text(value.name, 200) || !value.name.trim() || !text(value.city, 200) || !text(value.email, 254) || !text(value.phone, 40)) return false;
  if (value.email && (!/^[^\s@<>"'?:&#]+@[^\s@<>"'?:&#]+\.[^\s@<>"'?:&#]+$/.test(value.email) || /[\r\n]/.test(value.email))) return false;
  if (value.phone && (!/^\+?[\d\s().-]+$/.test(value.phone) || !/^\d{7,15}$/.test(value.phone.replace(/\D/g, "")))) return false;
  return [value.instagram, value.linkedin].every(url => {
    if (!text(url, 1000)) return false;
    if (url === "") return true;
    if (/[<>"'\s]/.test(url)) return false;
    try { const parsed = new URL(url); return parsed.protocol === "https:" && !parsed.username && !parsed.password; } catch { return false; }
  });
}
