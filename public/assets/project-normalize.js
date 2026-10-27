export function normalizeProject(project) {
  if (project.slug !== "edificio-residencial" || project.diagrams?.length) return project;
  const plans = project.plans || [];
  const first = plans[0];
  if (!first?.src?.endsWith("/images/projects/domus/plan-01.jpg")) return project;
  return {
    ...project,
    diagrams: [first],
    diagramSoftware: project.diagramSoftware || project.renderSoftware || "",
    plans: plans.slice(1),
  };
}


export function normalizeOtherProject(item) {
  return {
    ...item,
    category: item.category || "",
    cover: item.cover || item.images?.[0]?.src || "",
    year: item.year || "",
    location: item.location || "",
    discipline: item.discipline || "",
    diagrams: (item.diagrams || []).map((image, index) => ({ ...image, label: image.label || `Diagrama ${index + 1}` })),
    plans: (item.plans ?? item.executiveImages ?? []).map((image, index) => ({ ...image, label: image.label || `Desenho técnico ${index + 1}` })),
    renderSoftware: item.renderSoftware ?? item.executiveSoftware ?? "",
    diagramSoftware: item.diagramSoftware || "",
    photoSoftware: item.photoSoftware ?? item.tool ?? "",
    images: (item.images || []).map((image, index) => ({ ...image, label: image.label || 'Imagem ' + String(index + 1).padStart(2, '0'), fit: image.fit || "contain" })),
  };
}
