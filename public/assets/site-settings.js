import { profile, experiences, software } from "./data.js";
export const defaultSettings = {
  tools: { items: software },
  experience: { intro: "Prática em diferentes escalas do projeto arquitetônico.", entries: experiences },
  home: { year: "2026", featuredKind: "project", featuredSlug: "edificio-residencial" },
  contact: { name: profile.name, city: profile.city, email: profile.email, phone: profile.phone, instagram: profile.instagram, linkedin: profile.linkedin },
};
export function featuredProject(settings, projects, otherProjects) {
  const collection = settings.featuredKind === "other" ? otherProjects : projects;
  const selected = collection.find(item => item.slug === settings.featuredSlug);
  if (selected) return { ...selected, kind: settings.featuredKind };
  if (projects.length) return { ...projects[0], kind: "project" };
  return otherProjects.length ? { ...otherProjects[0], kind: "other" } : null;
}
export function featuredHref(project) {
  return '/' + (project.kind === 'other' ? 'outros-projetos' : 'projetos') + '/' + project.slug + '/';
}

export function contactPhoneHref(phone) {
  const digits = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) return '+' + digits;
  return digits.length === 10 || digits.length === 11 ? '+55' + digits : digits;
}
