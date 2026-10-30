// Keep unlisted and newly created projects after the saved sequence.
export function applyProjectOrder(projects, slugs = []) {
  const positions = new Map(slugs.map((slug, index) => [slug, index]));
  return [...projects].sort((a, b) => (positions.get(a.slug) ?? Infinity) - (positions.get(b.slug) ?? Infinity));
}
