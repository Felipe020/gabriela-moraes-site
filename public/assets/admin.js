import { defaultSettings, featuredProject } from "./site-settings.js";
import { defaultAbout } from "./about-data.js";
import { applyProjectOrder } from "./project-order.js";
import { projects as baselineProjects } from "./data.js";
import { otherProjects as baselineOther } from "./other-projects.js";
import { normalizeProject, normalizeOtherProject } from "./project-normalize.js";

const root = document.querySelector("#admin-app");
const escape = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
let entries = { project: baselineProjects.map(normalizeProject), other: baselineOther.map(normalizeOtherProject) };
let siteSettings = structuredClone(defaultSettings);
let aboutContent = { ...defaultAbout };
let currentArea = "projects";
let aboutPhotoPreview = null;
let currentKind = "project";
let selectedSlug = entries.project[0]?.slug || null;
let status = "";
let confirmDelete = false;
const imageStates = new WeakMap();
const imageFileFields = { images: "imageFiles", plans: "planFiles", diagrams: "diagramFiles", executiveImages: "executiveFiles" };

async function load() {
  entries = { project: baselineProjects.map(normalizeProject), other: baselineOther.map(normalizeOtherProject) };
  const response = await fetch("/api/items", { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível carregar os projetos.");
  const { items, orders = {}, about: savedAbout, settings = {} } = await response.json();
  siteSettings = { tools: structuredClone(settings.tools || defaultSettings.tools), experience: structuredClone(settings.experience || defaultSettings.experience), home: { ...defaultSettings.home, ...settings.home }, contact: { ...defaultSettings.contact, ...settings.contact } };
  aboutContent = { ...defaultAbout, ...savedAbout };
  for (const { kind, slug, item, deleted } of items) {
    const list = entries[kind];
    const index = list.findIndex((entry) => entry.slug === slug);
    if (deleted && index >= 0) list.splice(index, 1);
    else if (!deleted && index >= 0) list[index] = kind === "project" ? normalizeProject(item) : normalizeOtherProject(item);
    else if (!deleted) list.push(kind === "project" ? normalizeProject(item) : normalizeOtherProject(item));
  }
  entries.project = applyProjectOrder(entries.project, orders.project);
  entries.other = applyProjectOrder(entries.other, orders.other);
  render();
}

const slugify = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const isDrawing = (field) => field === "plans" || field === "diagrams";
const imageLines = (images, field) => images.map((image) => `${image.label || "Imagem"} | ${image.src}${isDrawing(field) && image.displayScale && image.displayScale !== 100 ? ` | ${image.displayScale}%` : ""}`).join("\n");
const parseLines = (text, field) => text.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
  if (!isDrawing(field)) {
    const separator = line.indexOf("|");
    return separator >= 0 ? { label: line.slice(0, separator).trim(), src: line.slice(separator + 1).trim() } : { label: "Imagem", src: line };
  }
  const parts = line.split("|").map((part) => part.trim());
  const image = parts.length > 1 ? { label: parts[0], src: parts[1] } : { label: "Imagem", src: line };
  const displayScale = Number(parts[2]?.replace(/%$/, ""));
  if (parts.length > 2 && Number.isInteger(displayScale) && displayScale >= 10 && displayScale <= 300) image.displayScale = displayScale;
  return image;
});

function savedImageItems(form, field) {
  const originals = entries[currentKind].find((entry) => entry.slug === selectedSlug)?.[field] || [];
  return parseLines(form.elements[field].value, field).map((image) => {
    const original = originals.find((entry) => entry.src === image.src);
    if (!original) return { kind: "saved", image };
    const { displayScale, ...metadata } = original;
    return { kind: "saved", image: { ...metadata, ...image } };
  });
}

function field(label, name, value = "", options = "", hint = "") {
  return `<label><span class="manager__field-label">${label}</span><input name="${name}" value="${escape(value)}" ${options}>${hint ? `<small>${hint}</small>` : ""}</label>`;
}

function imageEditor(item, name, title, hint) {
  const fileName = imageFileFields[name];
  return `<div class="manager__image-editor"><div class="manager__upload"><div><strong>Adicionar ${title.toLowerCase()}</strong><p>${hint}</p><small>JPG, PNG, WebP ou AVIF · até 15 MB por imagem</small></div><label class="manager__file-label">Escolher imagens<input name="${fileName}" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple></label></div><div class="manager__previews" data-previews="${name}"></div><details class="manager__advanced"><summary>Adicionar ou editar por links</summary><label>Links das imagens<textarea name="${name}" rows="4" placeholder="Nome da imagem | https://…">${escape(imageLines(item?.[name] || [], name))}</textarea><small>Uma imagem por linha, no formato Nome | Link. Você também pode usar o botão “Escolher imagens”.</small></label></details></div>`;
}

function editorSection(number, id, title, description, content) {
  return `<section class="manager__section" id="${id}"><div class="manager__section-heading"><span>${number}</span><div><h3>${title}</h3><p>${description}</p></div></div><div class="manager__section-body">${content}</div></section>`;
}

let hasUnsavedChanges = false;
const isLocalPreview = ["127.0.0.1", "localhost"].includes(location.hostname);
const leaveEditor = () => !hasUnsavedChanges || window.confirm("Há alterações não salvas. Deseja descartá-las e continuar?");
window.addEventListener("beforeunload", (event) => { if (hasUnsavedChanges) { event.preventDefault(); event.returnValue = ""; } });

function render() {
  if (aboutPhotoPreview) { URL.revokeObjectURL(aboutPhotoPreview); aboutPhotoPreview = null; }
  if (currentArea === "tools") { renderTools(); return; }
  if (currentArea === "experience") { renderExperiences(); return; }
  if (["home", "contact"].includes(currentArea)) { renderSettings(); return; }
  if (currentArea === "about") { renderAbout(); return; }
  const list = entries[currentKind];
  const item = list.find((entry) => entry.slug === selectedSlug);
  const academic = currentKind === "project";
  const info = `<div class="manager__fields">${field('Título do projeto <span class="manager__required">*</span>', "title", item?.title, 'required maxlength="160" placeholder="Ex.: Hall · Musik"')}${field(academic ? 'Tipo de arquitetura <span class="manager__required">*</span>' : "Tipo de arquitetura", "category", item?.category, `${academic ? "required" : ""} maxlength="160" placeholder="Ex.: Arquitetura de interiores"`, "Aparece abaixo do título na página inicial.")}${field("Ano", "year", item?.year, 'maxlength="30" placeholder="Ex.: 2026"')}${field("Local", "location", item?.location, 'maxlength="160" placeholder="Ex.: Juiz de Fora — MG"')}${field(academic ? "Disciplina" : "Participação / etapa", "discipline", item?.discipline, 'maxlength="160"', academic ? "" : "Ex.: Estágio — projeto executivo e renderização.")}<label class="manager__full">Sobre o projeto<textarea name="description" rows="4" ${academic ? "" : 'maxlength="5000"'} placeholder="Conte o objetivo, as ideias e sua participação no projeto.">${escape(Array.isArray(item?.description) ? item.description.join("\n") : item?.description || "")}</textarea><small>Separe os parágrafos com uma quebra de linha. Esta seção só aparece quando preenchida.</small></label></div><details class="manager__advanced"><summary>Endereço da página</summary>${field("Nome no endereço", "slug", item?.slug, `${item ? "readonly" : ""} required pattern="[a-z0-9]+(-[a-z0-9]+)*"`, item ? "Definido na criação para preservar o link deste projeto." : "Preenchido automaticamente pelo título. Use apenas letras minúsculas, números e hífens.")}</details>`;
  const cover = `<div class="manager__cover-editor"><h4>Capa do projeto</h4><p>A imagem que aparece na página inicial e na abertura do projeto.${academic ? "" : " Se não escolher uma capa, será usada a primeira imagem da galeria."}</p><label class="manager__upload manager__cover-upload"><span><strong>Escolher uma capa</strong><small>JPG, PNG, WebP ou AVIF · até 15 MB</small></span><input name="coverFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif"></label><div class="manager__previews" data-previews="cover"></div><details class="manager__advanced"><summary>Usar um link para a capa</summary>${field("Link da imagem", "cover", item?.cover, 'placeholder="https://…"')}</details></div>`;
  const gallery = `${cover}<div class="manager__fields manager__software">${field(academic ? "Software dos renders" : 'Software dos renders <span class="manager__required">*</span>', "photoSoftware", item?.photoSoftware || item?.tool, `${academic ? "" : "required"} maxlength="100" placeholder="Ex.: Enscape ou IA"`, "Aparece como crédito ao lado do título Renders.")}</div>${imageEditor(item, "images", "Renders", "Fotos e renders exibidos após os desenhos técnicos. Organize a ordem pelas miniaturas.")}`;
  const drawings = `<div class="manager__subsection"><h4>Diagramas</h4><div class="manager__fields">${field("Software dos diagramas", "diagramSoftware", item?.diagramSoftware, 'maxlength="160" placeholder="Ex.: Revit"')}</div>${imageEditor(item, "diagrams", "Diagramas", "Estudos, esquemas e diagramas conceituais.")}</div><div class="manager__subsection"><h4>Desenhos técnicos</h4><div class="manager__fields">${field("Software dos desenhos técnicos", "renderSoftware", item?.renderSoftware, 'maxlength="160" placeholder="Ex.: Revit"')}</div>${imageEditor(item, "plans", "Desenhos técnicos", "Plantas, cortes, fachadas e detalhamentos.")}</div>`;
  root.innerHTML = `<main class="manager"><header class="manager__header"><a href="/">← Voltar ao portfólio</a><span>GABRIELA MORAES / PAINEL DE EDIÇÃO</span><form action="/api/admin/logout" method="post"><button type="submit" class="manager__logout">Sair ↗</button></form></header>
  <div class="manager__intro"><div><p class="eyebrow">SEU PORTFÓLIO, DO SEU JEITO</p><h1>Gerenciar <em>projetos.</em></h1><p>Escolha um projeto, edite as informações e salve quando terminar.</p></div><div class="manager__guide"><span><b>01</b> Escolha o projeto</span><span><b>02</b> Edite textos e imagens</span><span><b>03</b> Salve as alterações</span></div></div>
  ${isLocalPreview ? '<div class="manager__notice"><strong>Você está na prévia local.</strong><span>As edições feitas aqui não alteram o site publicado.</span></div>' : ""}
  ${areaNavigation()}<div class="manager__tabs" role="tablist" aria-label="Tipo de projeto"><button role="tab" aria-selected="${academic}" data-kind="project" class="${academic ? "is-active" : ""}">Projetos acadêmicos <span>${entries.project.length}</span></button><button role="tab" aria-selected="${!academic}" data-kind="other" class="${!academic ? "is-active" : ""}">Outros projetos <span>${entries.other.length}</span></button></div>
  <div class="manager__grid"><aside class="manager__sidebar"><div class="manager__sidebar-head"><h2>Seus projetos</h2><span>${String(list.length).padStart(2,"0")}</span></div><button type="button" class="manager__sort-button" data-sort-projects>↕ Organizar ordem na página inicial</button><p class="manager__order-status" role="status" data-order-status></p><button class="manager__new" data-new>+ Criar novo projeto</button><label class="manager__search">Buscar projeto<input type="search" placeholder="Digite o nome…" data-search></label><div class="manager__list">${list.map(entry=>`<button type="button" class="manager__item ${entry.slug===selectedSlug ? "is-active" : ""}" data-edit="${escape(entry.slug)}" ${entry.slug===selectedSlug ? 'aria-current="true"' : ""}><img src="${escape(entry.cover || entry.images?.[0]?.src || "")}" alt="" loading="lazy"><span><strong>${escape(entry.title)}</strong><small>${escape(entry.category || (academic ? "Projeto acadêmico" : entry.tool))}</small></span><i aria-hidden="true">↗</i></button>`).join("")}<p class="manager__no-results" hidden>Nenhum projeto encontrado.</p></div><p class="manager__sidebar-note">Selecione um projeto da lista ou crie um novo para começar.</p></aside>
  <section class="manager__editor" aria-label="Editor de projeto"><div class="manager__editor-head"><div><p class="eyebrow">${item ? "EDITANDO" : "NOVO PROJETO"} · ${academic ? "ACADÊMICO" : "OUTROS PROJETOS"}</p><h2>${item ? escape(item.title) : "Vamos criar um projeto"}</h2><p>Campos com <span class="manager__required">*</span> são obrigatórios.</p></div>${item ? `<a class="manager__view" href="/${academic ? "projetos" : "outros-projetos"}/${escape(item.slug)}/" target="_blank" rel="noopener">Ver no portfólio ↗</a>` : ""}</div>
  <nav class="manager__section-nav" aria-label="Seções do formulário"><a href="#manager-info">01 Informações</a><a href="#manager-images">02 Capa e renders</a><a href="#manager-drawings">03 Desenhos técnicos</a></nav>
  <form id="manager-form">${editorSection("01", "manager-info", "Informações do projeto", "Os textos que apresentam seu trabalho no portfólio.", info)}${editorSection("02", "manager-images", "Capa e renders", "Envie as imagens e organize a sequência de apresentação.", gallery)}${editorSection("03", "manager-drawings", "Desenhos técnicos", "Opcional. Esta parte só aparece no site quando houver conteúdo.", drawings)}
  <div class="manager__actions"><div><span class="manager__save-indicator" aria-hidden="true"></span><span role="status" id="manager-status">${escape(status || "Nenhuma alteração pendente.")}</span></div><button type="submit">Salvar alterações <span aria-hidden="true">↗</span></button></div></form>
  ${item ? `<details class="manager__danger"><summary>Remover este projeto</summary><p>O projeto e sua galeria deixarão de aparecer no portfólio. Esta ação precisa ser confirmada.</p><button type="button" class="manager__delete" data-delete>${confirmDelete ? "Confirmar exclusão do projeto" : "Excluir projeto"}</button>${confirmDelete ? '<p role="status">Clique novamente no botão para confirmar a exclusão.</p>' : ""}</details>` : ""}</section></div></main>`;
  bindAreaNavigation();
  root.querySelector("[data-sort-projects]").addEventListener("click", openProjectOrder);
  const changeView = (action) => { if (!leaveEditor()) return; hasUnsavedChanges=false; status=""; confirmDelete=false; action(); render(); };
  root.querySelectorAll("[data-kind]").forEach(button=>button.addEventListener("click",()=>{ if(currentKind===button.dataset.kind)return;changeView(()=>{currentKind=button.dataset.kind;selectedSlug=entries[currentKind][0]?.slug || null;}); }));
  root.querySelectorAll("[data-edit]").forEach(button=>button.addEventListener("click",()=>{if(selectedSlug===button.dataset.edit)return;changeView(()=>{selectedSlug=button.dataset.edit;});}));
  root.querySelector("[data-new]").addEventListener("click",()=>changeView(()=>{selectedSlug=null;}));
  root.querySelector("[data-search]").addEventListener("input",event=>{const query=slugify(event.target.value);let count=0;root.querySelectorAll("[data-edit]").forEach(button=>{button.hidden=!slugify(button.textContent).includes(query);if(!button.hidden)count++;});root.querySelector(".manager__no-results").hidden=!!count;});
  root.querySelector("[data-delete]")?.addEventListener("click",()=>{if(!confirmDelete){confirmDelete=true;const zone=root.querySelector(".manager__danger");zone.querySelector("[data-delete]").textContent="Confirmar exclusão do projeto";const message=document.createElement("p");message.setAttribute("role","status");message.textContent="Clique novamente no botão para confirmar a exclusão.";zone.append(message);}else remove();});
  const form=root.querySelector("#manager-form");
  const markChanged=()=>{hasUnsavedChanges=true;const output=form.querySelector("#manager-status");output.textContent="Você tem alterações para salvar.";output.classList.remove("is-error");form.querySelector(".manager__save-indicator").classList.add("is-pending");};
  form.elements.title.addEventListener("input",()=>{if(!selectedSlug)form.elements.slug.value=slugify(form.elements.title.value);});
  form.addEventListener("input",markChanged);form.addEventListener("change",markChanged);
  form.addEventListener("click",event=>{if(event.target.closest(".manager__preview button"))markChanged();});
  form.addEventListener("drop",event=>{if(event.target.closest(".manager__preview"))markChanged();});
  form.addEventListener("invalid",event=>{const hidden=event.target.closest("details");if(hidden)hidden.open=true;},true);
  setupImagePreviews(form);form.addEventListener("submit",save);
}

function setupImagePreviews(form) {
  const fields = ["images", "plans", "diagrams", "executiveImages"];
  for (const field of fields) {
    if (!form.elements[field]) continue;
    form.elements[field].addEventListener("input", () => syncImageItems(form, field, "text"));
    renderImagePreviews(form, field);
  }
  for (const field of ["imageFiles", "planFiles", "diagramFiles", "executiveFiles"]) {
    if (!form.elements[field]) continue;
    form.elements[field].addEventListener("change", () => syncImageItems(form, field === "imageFiles" ? "images" : field === "planFiles" ? "plans" : field === "diagramFiles" ? "diagrams" : "executiveImages", "files"));
  }
  if (form.elements.cover) {
    form.elements.cover.addEventListener("input", () => renderImagePreviews(form, "cover"));
    form.elements.coverFile.addEventListener("change", () => renderImagePreviews(form, "cover"));
    renderImagePreviews(form, "cover");
  }
}

function imageItems(form, field) {
  let fields = imageStates.get(form);
  if (!fields) { fields = new Map(); imageStates.set(form, fields); }
  if (!fields.has(field)) fields.set(field, [
    ...savedImageItems(form, field),
    ...[...form.elements[imageFileFields[field]].files].map((file) => ({ kind: "file", file })),
  ]);
  return fields.get(field);
}

function syncImageItems(form, field, changed) {
  const items = imageItems(form, field);
  const saved = changed === "text" ? savedImageItems(form, field) : items.filter((entry) => entry.kind === "saved");
  const files = changed === "files" ? [...form.elements[imageFileFields[field]].files].map((file) => ({ kind: "file", file })) : items.filter((entry) => entry.kind === "file");
  imageStates.get(form).set(field, [...saved, ...files]);
  renderImagePreviews(form, field);
}

function updateImageOrder(form, field) {
  form.elements[field].value = imageLines(imageItems(form, field).filter((entry) => entry.kind === "saved").map((entry) => entry.image), field);
  const transfer = new DataTransfer();
  imageItems(form, field).filter((entry) => entry.kind === "file").forEach((entry) => transfer.items.add(entry.file));
  form.elements[imageFileFields[field]].files = transfer.files;
  renderImagePreviews(form, field);
}

function moveImage(form, field, from, to) {
  const items = imageItems(form, field);
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
  items.splice(to, 0, items.splice(from, 1)[0]);
  updateImageOrder(form, field);
}

function renderImagePreviews(form, field) {
  const container = form.querySelector(`[data-previews="${field}"]`);
  if (!container) return;
  container.replaceChildren();
  let draggedIndex = null;
  const addPreview = (src, label, onRemove, objectUrl = false, index = null, count = 1, entry = null) => {
    const card = document.createElement("span"); card.className = "manager__preview";
    const image = document.createElement("img"); image.src = src; image.alt = label;
    if (objectUrl) image.addEventListener("load", () => URL.revokeObjectURL(src), { once: true });
    const caption = document.createElement("span"); caption.textContent = label;
    const removeButton = document.createElement("button"); removeButton.type = "button"; removeButton.className = "manager__preview-remove"; removeButton.textContent = "×"; removeButton.setAttribute("aria-label", `Remover ${label}`);
    removeButton.addEventListener("click", (event) => { event.preventDefault(); onRemove(); });
    card.append(image, caption, removeButton);
    if (index !== null && count > 1) {
      card.draggable = true;
      card.setAttribute("aria-label", `${label}, imagem ${index + 1} de ${count}. Arraste para alterar a ordem.`);
      card.addEventListener("dragstart", (event) => { draggedIndex = index; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(index)); card.classList.add("is-dragging"); });
      card.addEventListener("dragend", () => { draggedIndex = null; container.querySelectorAll(".manager__preview").forEach((entry) => entry.classList.remove("is-dragging", "is-drop-target")); });
      card.addEventListener("dragover", (event) => { if (draggedIndex === null || draggedIndex === index) return; event.preventDefault(); event.dataTransfer.dropEffect = "move"; card.classList.add("is-drop-target"); });
      card.addEventListener("dragleave", () => card.classList.remove("is-drop-target"));
      card.addEventListener("drop", (event) => { if (draggedIndex === null) return; event.preventDefault(); moveImage(form, field, draggedIndex, index); });
      const controls = document.createElement("span"); controls.className = "manager__preview-order";
      for (const [direction, symbol, action] of [[-1, "←", "anterior"], [1, "→", "seguinte"]]) {
        const button = document.createElement("button"); button.type = "button"; button.textContent = symbol; button.disabled = index + direction < 0 || index + direction >= count;
        button.setAttribute("aria-label", `Mover ${label} para a posição ${action}`);
        button.addEventListener("click", (event) => { event.preventDefault(); moveImage(form, field, index, index + direction); });
        controls.append(button);
      }
      card.append(controls);
    }
    if (entry && isDrawing(field)) {
      const labelField = document.createElement("label"); labelField.className = "manager__drawing-name";
      const title = document.createElement("span"); title.textContent = "NOME NO SITE";
      const input = document.createElement("input"); input.type = "text"; input.required = true; input.maxLength = 160; input.value = label;
      input.setAttribute("aria-label", "Nome do " + (field === "diagrams" ? "diagrama" : "desenho técnico") + " " + (index + 1));
      input.addEventListener("input", () => {
        if (entry.kind === "saved") entry.image.label = input.value; else entry.label = input.value;
        image.alt = input.value; caption.textContent = input.value;
        form.elements[field].value = imageLines(imageItems(form, field).filter(item => item.kind === "saved").map(item => item.image), field);
      });
      labelField.append(title, input); card.append(labelField);
    }
    if (entry && isDrawing(field)) {
      const size = document.createElement("span"); size.className = "manager__preview-size";
      const description = document.createElement("span"); description.textContent = "TAMANHO DA IMAGEM (%)";
      const input = document.createElement("input"); input.type = "number"; input.min = "10"; input.max = "300"; input.step = "1";
      const imageData = entry.kind === "saved" ? entry.image : entry;
      input.value = imageData.displayScale || 100;
      input.setAttribute("aria-label", `Tamanho de ${label} no site, em porcentagem; 100 mantém o tamanho atual`);
      input.addEventListener("change", () => {
        const scale = Math.min(300, Math.max(10, Math.round(Number(input.value) || 100)));
        if (scale === 100) delete imageData.displayScale;
        else imageData.displayScale = scale;
        updateImageOrder(form, field);
      });
      size.append(description, input); card.append(size);
    }
    container.append(card);
  };
  if (field === "cover") {
    if (form.elements.cover.value.trim()) addPreview(form.elements.cover.value.trim(), "Capa", () => { form.elements.cover.value = ""; renderImagePreviews(form, field); });
    if (form.elements.coverFile.files[0]) {
      const file = form.elements.coverFile.files[0];
      addPreview(URL.createObjectURL(file), file.name, () => { form.elements.coverFile.value = ""; renderImagePreviews(form, field); }, true);
    }
    return;
  }
  const items = imageItems(form, field);
  if (isDrawing(field) && items.length) {
    const sizeHint = document.createElement("small"); sizeHint.className = "manager__reorder-hint"; sizeHint.textContent = "100% mantém o tamanho atual. Abaixo de 100% diminui; acima de 100% aumenta.";
    container.append(sizeHint);
  }
  if (items.length > 1) {
    const hint = document.createElement("small"); hint.className = "manager__reorder-hint"; hint.textContent = "Arraste as imagens ou use as setas para alterar a ordem. Clique em Salvar projeto para publicar.";
    container.append(hint);
  }
  items.forEach((entry, index) => {
    const label = entry.kind === "saved" ? entry.image.label || "Imagem" : entry.label || entry.file.name;
    const src = entry.kind === "saved" ? entry.image.src : URL.createObjectURL(entry.file);
    addPreview(src, label, () => { items.splice(index, 1); updateImageOrder(form, field); }, entry.kind === "file", index, items.length, entry);
  });
}

async function orderedImages(form, field) {
  const images = [];
  for (const entry of imageItems(form, field)) {
    images.push(entry.kind === "saved" ? entry.image : { label: entry.label || entry.file.name.replace(/\.[^.]+$/, ""), src: await upload(entry.file), ...(entry.displayScale ? { displayScale: entry.displayScale } : {}) });
  }
  return images;
}

async function upload(file) {
  if (root.dataset.uploadMode === "blob") {
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || !file.size || file.size > 15000000) throw new Error("Use uma imagem JPG, PNG, WebP ou AVIF de até 15 MB.");
    const { uploadImage } = await import("./blob-upload.js?v=1");
    return uploadImage(file);
  }
  const data = new FormData(); data.set("file", file);
  const response = await fetch("/api/upload", { method: "POST", body: data });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Falha no envio da imagem.");
  return result.url;
}

async function save(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  const output = form.querySelector("#manager-status");
  output.textContent = "Salvando…";
  try {
    const values = new FormData(form);
    const slug = String(values.get("slug") || "").trim();
    if (!selectedSlug && entries[currentKind].some((entry) => entry.slug === slug)) throw new Error("Já existe um projeto com este endereço.");
    const images = await orderedImages(form, "images");
    const item = { id: selectedSlug ? entries[currentKind].find((entry) => entry.slug === selectedSlug)?.id : String(entries[currentKind].length + 1).padStart(2, "0"), slug, title: String(values.get("title") || "").trim(), images };
    item.category = String(values.get("category") || "").trim();
    item.year = String(values.get("year") || "").trim();
    item.location = String(values.get("location") || "").trim();
    item.discipline = String(values.get("discipline") || "").trim();
    item.renderSoftware = String(values.get("renderSoftware") || "").trim();
    item.diagramSoftware = String(values.get("diagramSoftware") || "").trim();
    item.photoSoftware = String(values.get("photoSoftware") || "").trim();
    const description = String(values.get("description") || "").trim();
    item.description = currentKind === "project" ? description.split("\n").map(line => line.trim()).filter(Boolean) : description;
    const cover = String(values.get("cover") || "").trim();
    if (currentKind === "project" && !form.elements.coverFile.files[0] && !cover) throw new Error("Adicione uma imagem de capa.");
    item.cover = form.elements.coverFile.files[0] ? await upload(form.elements.coverFile.files[0]) : cover || images[0]?.src || "";
    item.plans = await orderedImages(form, "plans");
    item.diagrams = await orderedImages(form, "diagrams");
    if (currentKind === "other") {
      item.tool = item.photoSoftware;
      item.executiveSoftware = item.renderSoftware;
      item.executiveImages = item.plans;
    }
    const response = await fetch("/api/items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: currentKind, slug, item }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Não foi possível salvar.");
    selectedSlug = slug; hasUnsavedChanges = false; status = isLocalPreview ? "Alterações salvas nesta prévia local." : "Alterações salvas no portfólio."; await load();
  } catch (error) { output.textContent = error.message; output.classList.add("is-error"); button.disabled = false; }
}

async function remove() {
  const item = entries[currentKind].find((entry) => entry.slug === selectedSlug);
  if (!item) return;
  const response = await fetch("/api/items", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: currentKind, slug: selectedSlug }) });
  if (!response.ok) { status = "Não foi possível excluir."; render(); return; }
  selectedSlug = null; hasUnsavedChanges = false; confirmDelete = false; status = "Projeto excluído."; await load();
}

load().catch((error) => { root.innerHTML = `<main class="manager"><h1>Não foi possível abrir o gerenciador.</h1><p>${escape(error.message)}</p><a href="/">Voltar ao portfólio</a></main>`; });

function openProjectOrder() {
  const kind = currentKind;
  let draft = [...entries[kind]];
  let saving = false;
  const dialog = document.createElement("dialog");
  dialog.className = "manager__order-dialog";
  dialog.setAttribute("aria-labelledby", "project-order-title");
  dialog.innerHTML = '<div class="manager__order-heading"><p class="eyebrow">PÁGINA INICIAL</p><h2 id="project-order-title">Ordem dos projetos</h2><p>' + (kind === "project" ? 'Projetos acadêmicos' : 'Outros projetos') + ' · Use as setas para subir ou descer cada projeto. O primeiro da lista aparece primeiro no site.</p></div><ol class="manager__order-list"></ol><p role="status" class="manager__order-feedback"></p><div class="manager__order-actions"><button type="button" data-order-cancel>Cancelar</button><button type="button" data-order-save>Salvar ordem</button></div>';
  const list = dialog.querySelector("ol");
  const output = dialog.querySelector('[role="status"]');
  const paint = (focusSlug, direction) => {
    list.innerHTML = draft.map((item, index) => '<li><span class="manager__order-number">' + String(index + 1).padStart(2, '0') + '</span><img src="' + escape(item.cover || item.images?.[0]?.src || '') + '" alt=""><strong>' + escape(item.title) + '</strong><span class="manager__order-arrows"><button type="button" data-order-up="' + index + '" aria-label="Subir ' + escape(item.title) + '" ' + (index === 0 ? 'disabled' : '') + '>↑</button><button type="button" data-order-down="' + index + '" aria-label="Descer ' + escape(item.title) + '" ' + (index === draft.length - 1 ? 'disabled' : '') + '>↓</button></span></li>').join('');
    if (focusSlug) {
      const index = draft.findIndex(item => item.slug === focusSlug);
      const preferred = list.querySelector('[data-order-' + direction + '="' + index + '"]');
      const fallback = list.querySelector('[data-order-' + (direction === 'up' ? 'down' : 'up') + '="' + index + '"]');
      (preferred?.disabled ? fallback : preferred)?.focus();
    }
  };
  list.addEventListener('click', event => {
    const button = event.target.closest('[data-order-up], [data-order-down]');
    if (!button || saving) return;
    const direction = button.hasAttribute('data-order-up') ? 'up' : 'down';
    const from = Number(button.getAttribute('data-order-' + direction));
    const to = from + (direction === 'up' ? -1 : 1);
    if (to < 0 || to >= draft.length) return;
    const moved = draft.splice(from, 1)[0];
    draft.splice(to, 0, moved);
    output.textContent = moved.title + ' está na posição ' + (to + 1) + '. Clique em Salvar ordem para confirmar.';
    paint(moved.slug, direction);
  });
  dialog.querySelector('[data-order-cancel]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
  dialog.addEventListener('close', () => dialog.remove());
  dialog.querySelector('[data-order-save]').addEventListener('click', async () => {
    if (saving) return;
    saving = true;
    dialog.querySelectorAll('button').forEach(button => { button.disabled = true; });
    output.textContent = 'Salvando ordem…';
    try {
      const response = await fetch('/api/order', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, slugs: draft.map(item => item.slug) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar a ordem.');
      entries[kind] = draft;
      const sidebar = root.querySelector('.manager__list');
      draft.forEach(item => { const button = [...sidebar.querySelectorAll('[data-edit]')].find(button => button.dataset.edit === item.slug); if (button) sidebar.append(button); });
      root.querySelector('[data-order-status]').textContent = isLocalPreview ? 'Ordem salva nesta prévia.' : 'Ordem salva na página inicial.';
      dialog.close();
    } catch (error) {
      output.textContent = error.message;
      dialog.querySelectorAll('[data-order-cancel], [data-order-save]').forEach(button => { button.disabled = false; });
      paint();
    } finally { saving = false; }
  });
  paint();
  document.body.append(dialog);
  dialog.showModal();
}

function areaNavigation() {
  return '<nav class="manager__areas" aria-label="O que editar">' + [['projects','Projetos'], ['about','Sobre mim'], ['experience','Experiências'], ['tools','Ferramentas'], ['home','Página inicial'], ['contact','Contato']].map(([area, label]) => '<button type="button" data-area="' + area + '" ' + (currentArea === area ? 'aria-current="page"' : '') + '>' + label + '</button>').join('') + '</nav>';
}
function bindAreaNavigation() {
  root.querySelectorAll('[data-area]').forEach(button => button.addEventListener('click', () => {
    if (currentArea === button.dataset.area || !leaveEditor()) return;
    hasUnsavedChanges = false; status = ''; currentArea = button.dataset.area; render();
  }));
}
function renderAbout() {
  root.innerHTML = '<main class="manager"><header class="manager__header"><a href="/">← Voltar ao portfólio</a><span>GABRIELA MORAES / PAINEL DE EDIÇÃO</span><form action="/api/admin/logout" method="post"><button type="submit" class="manager__logout">Sair ↗</button></form></header><div class="manager__intro"><div><p class="eyebrow">SUA APRESENTAÇÃO</p><h1>Editar <em>Sobre mim.</em></h1><p>Atualize sua foto, seu texto de apresentação e sua formação.</p></div></div>' +
    (isLocalPreview ? '<div class="manager__notice"><strong>Você está na prévia local.</strong><span>As edições feitas aqui não alteram o site publicado.</span></div>' : '') + areaNavigation() +
    '<form id="about-form" class="manager__about-form">' +
    editorSection('01', 'about-photo', 'Foto de apresentação', 'A foto exibida na seção Sobre mim da página inicial.', '<div class="manager__about-photo"><img data-about-photo src="' + escape(aboutContent.photo) + '" alt="Foto de apresentação atual"><div><label class="manager__file-label">Escolher nova foto<input name="photoFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif"></label><p>JPG, PNG, WebP ou AVIF · até 15 MB</p><p data-photo-status role="status">A foto atual será mantida se você não escolher outra.</p></div></div>') +
    editorSection('02', 'about-text', 'Texto de apresentação', 'Conte quem você é e o que guia o seu trabalho.', '<div class="manager__fields">' +
      field('Nome completo *', 'name', aboutContent.name, 'required maxlength="200"') + field('Cidade', 'city', aboutContent.city, 'maxlength="200"') + field('Frase acima do título', 'subtitle', aboutContent.subtitle, 'maxlength="200"') +
      '<label class="manager__full">Sobre mim *<textarea name="description" rows="9" required>' + escape(aboutContent.description.join('\n\n')) + '</textarea><small>Separe os parágrafos com uma linha em branco.</small></label><label class="manager__full">Áreas de interesse<textarea name="keywords" rows="3">' + escape(aboutContent.keywords.join('\n')) + '</textarea><small>Uma área por linha. Aparecem no final da seção Sobre mim.</small></label></div>') +
    editorSection('03', 'about-education', 'Formação', 'Curso, instituição e período de estudo.', '<div class="manager__fields">' + field('Curso', 'degree', aboutContent.degree, 'maxlength="200"') + field('Instituição', 'institution', aboutContent.institution, 'maxlength="200"') + field('Período de estudo', 'educationPeriod', aboutContent.educationPeriod, 'maxlength="200"') + field('Semestre atual', 'currentSemester', aboutContent.currentSemester, 'maxlength="200"') + '</div>') +
    '<div class="manager__actions"><div><span class="manager__save-indicator" aria-hidden="true"></span><span id="about-status" role="status">' + escape(status || 'Nenhuma alteração pendente.') + '</span></div><button type="submit">Salvar Sobre mim ↗</button></div></form></main>';
  bindAreaNavigation();
  const form = root.querySelector('#about-form');
  const output = form.querySelector('#about-status');
  const markChanged = () => { hasUnsavedChanges = true; output.textContent = 'Você tem alterações para salvar.'; output.classList.remove('is-error'); form.querySelector('.manager__save-indicator').classList.add('is-pending'); };
  form.addEventListener('input', markChanged); form.addEventListener('change', markChanged);
  form.elements.photoFile.addEventListener('change', () => {
    if (aboutPhotoPreview) { URL.revokeObjectURL(aboutPhotoPreview); aboutPhotoPreview = null; }
    const file = form.elements.photoFile.files[0];
    const message = form.querySelector('[data-photo-status]');
    if (file && (!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type) || file.size > 15000000 || !file.size)) {
      form.elements.photoFile.value = ''; message.textContent = 'Use uma imagem JPG, PNG, WebP ou AVIF de até 15 MB.';
      form.querySelector('[data-about-photo]').src = aboutContent.photo; return;
    }
    aboutPhotoPreview = file ? URL.createObjectURL(file) : null;
    form.querySelector('[data-about-photo]').src = aboutPhotoPreview || aboutContent.photo;
    message.textContent = file ? file.name + ' — clique em Salvar Sobre mim para confirmar.' : 'A foto atual será mantida.';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]'); button.disabled = true; output.textContent = 'Salvando apresentação…';
    form.querySelectorAll('input,textarea').forEach(input => { input.disabled = true; });
    try {
      const item = { ...aboutContent };
      for (const name of ['name','city','subtitle','degree','institution','educationPeriod','currentSemester']) item[name] = form.elements[name].value.trim();
      item.description = form.elements.description.value.split(/\n\s*\n/).map(line => line.trim()).filter(Boolean);
      item.keywords = form.elements.keywords.value.split('\n').map(line => line.trim()).filter(Boolean);
      if (!item.description.length || item.description.length > 12 || item.description.some(line => line.length > 3000)) throw new Error('Preencha até 12 parágrafos, com no máximo 3.000 caracteres cada.');
      if (item.keywords.length > 16 || item.keywords.some(word => word.length > 100)) throw new Error('Use até 16 áreas de interesse, com até 100 caracteres cada.');
      const file = form.elements.photoFile.files[0];
      if (file) item.photo = await upload(file);
      const response = await fetch('/api/about', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar sua apresentação.');
      aboutContent = item; hasUnsavedChanges = false;
      status = isLocalPreview ? 'Sobre mim salvo nesta prévia.' : 'Sobre mim atualizado no site.';
      render();
    } catch (error) { output.textContent = error.message; output.classList.add('is-error'); }
    finally { button.disabled = false; form.querySelectorAll('input,textarea').forEach(input => { input.disabled = false; }); }
  });
}

function renderSettings() {
  const home = currentArea === 'home';
  const section = home ? 'home' : 'contact';
  const item = siteSettings[section];
  const chosen = item.featuredSlug ? item.featuredKind + ':' + item.featuredSlug : '';
  const available = [...entries.project.map(entry => 'project:' + entry.slug), ...entries.other.map(entry => 'other:' + entry.slug)];
  const featuredSelect = '<label class="manager__full">Projeto em destaque<select name="featured"><option value="">Automático — primeiro projeto da lista</option>' + (chosen && !available.includes(chosen) ? '<option value="' + escape(chosen) + '">Projeto indisponível — escolha outro</option>' : '') + [['project','Projetos acadêmicos'],['other','Outros projetos']].map(([kind,label]) => '<optgroup label="' + label + '">' + entries[kind].map(entry => '<option value="' + kind + ':' + escape(entry.slug) + '">' + escape(entry.title) + '</option>').join('') + '</optgroup>').join('') + '</select><small>Escolha o projeto da imagem de abertura. Essa escolha é independente da ordem dos projetos.</small></label><div class="manager__featured-preview manager__full" data-featured-preview></div>';
  const homeFields = '<div class="manager__fields">' + field('Ano do portfólio *','year',item.year,'required inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4"','Aparece no topo da página e no rodapé.') + featuredSelect + '</div>';
  const contactFields = '<div class="manager__fields">' + field('Nome para contato *','name',item.name,'required maxlength="200"') + field('Cidade','city',item.city,'maxlength="200"') + field('E-mail','email',item.email,'type="email" maxlength="254"','Também será o destinatário das mensagens preparadas pelo formulário do site.') + field('Telefone','phone',item.phone,'type="tel" maxlength="40" placeholder="+55 (32) 99900-0000"','Inclua o código do país para chamadas internacionais.') + field('Instagram','instagram',item.instagram,'type="url" maxlength="1000" placeholder="https://www.instagram.com/…"') + field('LinkedIn','linkedin',item.linkedin,'type="url" maxlength="1000" placeholder="https://www.linkedin.com/in/…"') + '</div><p class="manager__settings-hint">Os campos opcionais deixados vazios não aparecem no contato do site.</p>';
  root.innerHTML = '<main class="manager"><header class="manager__header"><a href="/">← Voltar ao portfólio</a><span>GABRIELA MORAES / PAINEL DE EDIÇÃO</span><form action="/api/admin/logout" method="post"><button type="submit" class="manager__logout">Sair ↗</button></form></header><div class="manager__intro"><div><p class="eyebrow">SEU PORTFÓLIO, DO SEU JEITO</p><h1>Editar <em>' + (home ? 'página inicial.' : 'contato.') + '</em></h1><p>' + (home ? 'Defina o ano e escolha qual projeto abre o portfólio.' : 'Atualize as informações de contato exibidas no fim da página inicial.') + '</p></div></div>' + (isLocalPreview ? '<div class="manager__notice"><strong>Você está na prévia local.</strong><span>As edições feitas aqui não alteram o site publicado.</span></div>' : '') + areaNavigation() + '<form id="settings-form" class="manager__about-form">' + editorSection('01','site-settings',home ? 'Ano e projeto em destaque' : 'Informações de contato',home ? 'Personalize a apresentação da página inicial.' : 'Preencha os canais pelos quais deseja receber mensagens.',home ? homeFields : contactFields) + '<div class="manager__actions"><div><span class="manager__save-indicator" aria-hidden="true"></span><span id="settings-status" role="status">' + escape(status || 'Nenhuma alteração pendente.') + '</span></div><button type="submit">Salvar ' + (home ? 'página inicial' : 'contato') + ' ↗</button></div></form></main>';
  bindAreaNavigation();
  const form = root.querySelector('#settings-form');
  const output = form.querySelector('#settings-status');
  if (home) {
    form.elements.featured.value = chosen;
    const preview = () => {
      const [featuredKind, featuredSlug = ''] = form.elements.featured.value.split(':');
      const selected = featuredProject({featuredKind: featuredKind || 'project', featuredSlug}, entries.project, entries.other);
      form.querySelector('[data-featured-preview]').innerHTML = selected ? '<img src="' + escape(selected.cover) + '" alt="Capa de ' + escape(selected.title) + '"><div><strong>' + escape(selected.title) + '</strong><p>' + (selected.kind === 'other' ? 'Outros projetos' : 'Projetos acadêmicos') + '</p></div>' : '<p>Crie um projeto para escolher o destaque.</p>';
    };
    preview(); form.elements.featured.addEventListener('change', preview);
  }
  const markChanged = () => { hasUnsavedChanges = true; output.textContent = 'Você tem alterações para salvar.'; output.classList.remove('is-error'); form.querySelector('.manager__save-indicator').classList.add('is-pending'); };
  form.addEventListener('input',markChanged); form.addEventListener('change',markChanged);
  form.addEventListener('submit',async event => {
    event.preventDefault(); const button=form.querySelector('[type="submit"]');button.disabled=true;output.textContent='Salvando alterações…';
    form.querySelectorAll('input,select').forEach(input=>{input.disabled=true;});
    try {
      let value;
      if (home) { const [kind,slug='']=form.elements.featured.value.split(':');value={year:form.elements.year.value.trim(),featuredKind:kind||'project',featuredSlug:slug}; }
      else value=Object.fromEntries(['name','city','email','phone','instagram','linkedin'].map(key=>[key,form.elements[key].value.trim()]));
      const response=await fetch('/api/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({section,value})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível salvar.');
      siteSettings[section]=value;hasUnsavedChanges=false;status=isLocalPreview?'Alterações salvas nesta prévia.':'Alterações salvas no site.';render();
    } catch(error){output.textContent=error.message;output.classList.add('is-error');}
    finally{button.disabled=false;form.querySelectorAll('input,select').forEach(input=>{input.disabled=false;});}
  });
}

function renderExperiences() {
  const draft = structuredClone(siteSettings.experience);
  root.innerHTML = '<main class="manager"><header class="manager__header"><a href="/">← Voltar ao portfólio</a><span>GABRIELA MORAES / PAINEL DE EDIÇÃO</span><form action="/api/admin/logout" method="post"><button type="submit" class="manager__logout">Sair ↗</button></form></header><div class="manager__intro"><div><p class="eyebrow">SUA TRAJETÓRIA</p><h1>Editar <em>experiências.</em></h1><p>Adicione experiências, atualize os dados e organize a ordem em que aparecem no site.</p></div></div>' + (isLocalPreview ? '<div class="manager__notice"><strong>Você está na prévia local.</strong><span>As edições feitas aqui não alteram o site publicado.</span></div>' : '') + areaNavigation() + '<form id="experience-form" class="manager__about-form">' + editorSection('01','experience-intro','Apresentação da seção','O texto exibido ao lado do título Experiências.','<label class="manager__experience-intro">Texto de apresentação<textarea name="intro" rows="3" maxlength="600">' + escape(draft.intro) + '</textarea></label>') + editorSection('02','experience-list','Suas experiências','Preencha empresa, atividade e período. Use as setas para alterar a ordem.','<div data-experience-list></div><button type="button" class="manager__add-experience" data-add-experience>+ Adicionar experiência</button><p class="manager__settings-hint">Você pode adicionar até 40 experiências. Se remover todas e salvar, esta seção deixará de aparecer no site.</p>') + '<div class="manager__actions"><div><span class="manager__save-indicator" aria-hidden="true"></span><span id="experience-status" role="status">' + escape(status || 'Nenhuma alteração pendente.') + '</span></div><button type="submit">Salvar experiências ↗</button></div></form></main>';
  bindAreaNavigation();
  const form = root.querySelector('#experience-form');
  const list = form.querySelector('[data-experience-list]');
  const output = form.querySelector('#experience-status');
  const addButton = form.querySelector('[data-add-experience]');
  const markChanged = message => { hasUnsavedChanges=true; output.textContent=message || 'Você tem alterações para salvar.'; output.classList.remove('is-error'); form.querySelector('.manager__save-indicator').classList.add('is-pending'); };
  const paint = () => {
    list.innerHTML = draft.entries.length ? draft.entries.map((entry,index) => '<section class="manager__experience-card" data-experience-index="' + index + '" aria-label="Experiência ' + (index+1) + '"><div class="manager__experience-card-head"><h4>Experiência ' + String(index+1).padStart(2,'0') + '</h4><div><button type="button" data-experience-up="' + index + '" aria-label="Subir experiência ' + (index+1) + '" ' + (index===0?'disabled':'') + '>↑</button><button type="button" data-experience-down="' + index + '" aria-label="Descer experiência ' + (index+1) + '" ' + (index===draft.entries.length-1?'disabled':'') + '>↓</button><button type="button" class="manager__remove-experience" data-experience-remove="' + index + '">Remover<span class="sr-only"> experiência ' + (index+1) + '</span></button></div></div><div class="manager__fields">' + field('Escritório / empresa *','studio-'+index,entry.studio,'required maxlength="200" placeholder="Ex.: DOTS ARQUITETURA" data-experience-field="studio"') + field('Cargo / atividade *','role-'+index,entry.role,'required maxlength="200" placeholder="Ex.: Estágio em Arquitetura e Urbanismo" data-experience-field="role"') + field('Período *','period-'+index,entry.period,'required maxlength="80" placeholder="Ex.: 2026 — atual" data-experience-field="period"') + '</div></section>').join('') : '<p class="manager__experience-empty">Nenhuma experiência na lista. Clique em “Adicionar experiência” para começar.</p>';
    addButton.disabled = draft.entries.length >= 40;
  };
  form.addEventListener('input', event => {
    if (event.target.name === 'intro') draft.intro=event.target.value;
    if (event.target.dataset.experienceField) draft.entries[Number(event.target.closest('[data-experience-index]').dataset.experienceIndex)][event.target.dataset.experienceField]=event.target.value;
    markChanged();
  });
  addButton.addEventListener('click', () => {
    if (draft.entries.length>=40) return;
    draft.entries.push({studio:'',role:'',period:''});paint();markChanged('Nova experiência adicionada. Preencha os campos e salve.');
    form.elements['studio-'+(draft.entries.length-1)].focus();
  });
  list.addEventListener('click', event => {
    const button=event.target.closest('[data-experience-up],[data-experience-down],[data-experience-remove]');
    if (!button) return;
    if (button.hasAttribute('data-experience-remove')) {
      const index=Number(button.dataset.experienceRemove);draft.entries.splice(index,1);paint();markChanged('Experiência removida da lista. Salve para confirmar.');
      (form.elements['studio-'+Math.min(index,draft.entries.length-1)] || addButton).focus();return;
    }
    const up=button.hasAttribute('data-experience-up');const from=Number(up?button.dataset.experienceUp:button.dataset.experienceDown);const to=from+(up?-1:1);
    if(to<0||to>=draft.entries.length)return;
    draft.entries.splice(to,0,draft.entries.splice(from,1)[0]);paint();markChanged('Ordem alterada. Salve para confirmar.');
    const preferred=list.querySelector('[data-experience-'+(up?'up':'down')+'="'+to+'"]');
    (preferred.disabled ? form.elements['studio-'+to] : preferred).focus();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const value={intro:draft.intro.trim(),entries:draft.entries.map(entry=>Object.fromEntries(['studio','role','period'].map(key=>[key,entry[key].trim()])))};
    const controls=[...form.querySelectorAll('input,textarea,button')];const states=controls.map(control=>control.disabled);controls.forEach(control=>{control.disabled=true;});output.textContent='Salvando experiências…';
    try {
      const response=await fetch('/api/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({section:'experience',value})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível salvar as experiências.');
      siteSettings.experience=value;hasUnsavedChanges=false;status=isLocalPreview?'Experiências salvas nesta prévia.':'Experiências atualizadas no site.';render();
    } catch(error) { output.textContent=error.message;output.classList.add('is-error');controls.forEach((control,index)=>{control.disabled=states[index];}); }
  });
  paint();
}

function renderTools() {
  const draft = [...siteSettings.tools.items];
  root.innerHTML = '<main class="manager"><header class="manager__header"><a href="/">← Voltar ao portfólio</a><span>GABRIELA MORAES / PAINEL DE EDIÇÃO</span><form action="/api/admin/logout" method="post"><button type="submit" class="manager__logout">Sair ↗</button></form></header><div class="manager__intro"><div><p class="eyebrow">FERRAMENTAS DE TRABALHO</p><h1>Editar <em>ferramentas.</em></h1><p>Adicione, renomeie ou remova os programas que aparecem na página inicial.</p></div></div>' + (isLocalPreview ? '<div class="manager__notice"><strong>Você está na prévia local.</strong><span>As edições feitas aqui não alteram o site publicado.</span></div>' : '') + areaNavigation() + '<form id="tools-form" class="manager__about-form">' + editorSection('01','tools-list','Suas ferramentas','Até 40 ferramentas. Se remover todas, a seção não aparecerá no site.','<div data-tools-list></div><button type="button" class="manager__add-experience" data-add-tool>+ Adicionar ferramenta</button>') + '<div class="manager__actions"><div><span class="manager__save-indicator" aria-hidden="true"></span><span id="tools-status" role="status">' + escape(status || 'Nenhuma alteração pendente.') + '</span></div><button type="submit">Salvar ferramentas ↗</button></div></form></main>';
  bindAreaNavigation();
  const form=root.querySelector('#tools-form');const list=form.querySelector('[data-tools-list]');const output=form.querySelector('#tools-status');const add=form.querySelector('[data-add-tool]');
  const mark=()=>{hasUnsavedChanges=true;output.textContent='Você tem alterações para salvar.';output.classList.remove('is-error');form.querySelector('.manager__save-indicator').classList.add('is-pending');};
  const paint=()=>{list.innerHTML=draft.length?draft.map((tool,index)=>'<div class="manager__tool-row"><label>Ferramenta '+(index+1)+'<input name="tool-'+index+'" data-tool-index="'+index+'" value="'+escape(tool)+'" required maxlength="100" placeholder="Ex.: Revit"></label><button type="button" data-remove-tool="'+index+'" aria-label="Remover ferramenta '+(index+1)+'">Remover</button></div>').join(''):'<p class="manager__experience-empty">Nenhuma ferramenta. Clique em “Adicionar ferramenta” para começar.</p>';add.disabled=draft.length>=40;};
  list.addEventListener('input',event=>{if(event.target.hasAttribute('data-tool-index')){draft[Number(event.target.dataset.toolIndex)]=event.target.value;mark();}});
  list.addEventListener('click',event=>{const button=event.target.closest('[data-remove-tool]');if(!button)return;draft.splice(Number(button.dataset.removeTool),1);paint();mark();add.focus();});
  add.addEventListener('click',()=>{if(draft.length>=40)return;draft.push('');paint();mark();form.elements['tool-'+(draft.length-1)].focus();});
  form.addEventListener('submit',async event=>{event.preventDefault();const controls=[...form.querySelectorAll('input,button')];const states=controls.map(c=>c.disabled);controls.forEach(c=>{c.disabled=true;});output.textContent='Salvando ferramentas…';
    try{const value={items:draft.map(name=>name.trim())};const response=await fetch('/api/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({section:'tools',value})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível salvar.');siteSettings.tools=value;hasUnsavedChanges=false;status=isLocalPreview?'Ferramentas salvas nesta prévia.':'Ferramentas atualizadas no site.';render();}
    catch(error){output.textContent=error.message;output.classList.add('is-error');controls.forEach((c,index)=>{c.disabled=states[index];});}
  });paint();
}
