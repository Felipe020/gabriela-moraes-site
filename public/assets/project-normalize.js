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
