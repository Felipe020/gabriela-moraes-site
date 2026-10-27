import { projects as baselineProjects } from "./data.js";
import { otherProjects as baselineOther } from "./other-projects.js";
import { normalizeProject, normalizeOtherProject } from "./project-normalize.js";

const root = document.querySelector("#admin-app");
const escape = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
let entries = { project: baselineProjects.map(normalizeProject), other: baselineOther.map(normalizeOtherProject) };
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
  const { items } = await response.json();
  for (const { kind, slug, item, deleted } of items) {
    const list = entries[kind];
    const index = list.findIndex((entry) => entry.slug === slug);
    if (deleted && index >= 0) list.splice(index, 1);
    else if (!deleted && index >= 0) list[index] = kind === "project" ? normalizeProject(item) : normalizeOtherProject(item);
    else if (!deleted) list.push(kind === "project" ? normalizeProject(item) : normalizeOtherProject(item));
  }
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
  const list = entries[currentKind];
  const item = list.find((entry) => entry.slug === selectedSlug);
  const academic = currentKind === "project";
  const info = `<div class="manager__fields">${field('Título do projeto <span class="manager__required">*</span>', "title", item?.title, 'required maxlength="160" placeholder="Ex.: Hall · Musik"')}${field(academic ? 'Tipo de arquitetura <span class="manager__required">*</span>' : "Tipo de arquitetura", "category", item?.category, `${academic ? "required" : ""} maxlength="160" placeholder="Ex.: Arquitetura de interiores"`, "Aparece abaixo do título na página inicial.")}${field("Ano", "year", item?.year, 'maxlength="30" placeholder="Ex.: 2026"')}${field("Local", "location", item?.location, 'maxlength="160" placeholder="Ex.: Juiz de Fora — MG"')}${field(academic ? "Disciplina" : "Participação / etapa", "discipline", item?.discipline, 'maxlength="160"', academic ? "" : "Ex.: Estágio — projeto executivo e renderização.")}<label class="manager__full">Sobre o projeto<textarea name="description" rows="4" ${academic ? "" : 'maxlength="5000"'} placeholder="Conte o objetivo, as ideias e sua participação no projeto.">${escape(Array.isArray(item?.description) ? item.description.join("\n") : item?.description || "")}</textarea><small>Separe os parágrafos com uma quebra de linha. Esta seção só aparece quando preenchida.</small></label></div><details class="manager__advanced"><summary>Endereço da página</summary>${field("Nome no endereço", "slug", item?.slug, `${item ? "readonly" : ""} required pattern="[a-z0-9]+(-[a-z0-9]+)*"`, item ? "Definido na criação para preservar o link deste projeto." : "Preenchido automaticamente pelo título. Use apenas letras minúsculas, números e hífens.")}</details>`;
  const cover = `<div class="manager__cover-editor"><h4>Capa do projeto</h4><p>A imagem que aparece na página inicial e na abertura do projeto.${academic ? "" : " Se não escolher uma capa, será usada a primeira imagem da galeria."}</p><label class="manager__upload manager__cover-upload"><span><strong>Escolher uma capa</strong><small>JPG, PNG, WebP ou AVIF · até 15 MB</small></span><input name="coverFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif"></label><div class="manager__previews" data-previews="cover"></div><details class="manager__advanced"><summary>Usar um link para a capa</summary>${field("Link da imagem", "cover", item?.cover, 'placeholder="https://…"')}</details></div>`;
  const gallery = `${cover}<div class="manager__fields manager__software">${field(academic ? "Software dos renders" : 'Software dos renders <span class="manager__required">*</span>', "photoSoftware", item?.photoSoftware || item?.tool, `${academic ? "" : "required"} maxlength="100" placeholder="Ex.: Enscape ou IA"`, "Aparece como crédito ao lado do título Renders.")}</div>${imageEditor(item, "images", "Renders", "Fotos e renders exibidos após os desenhos técnicos. Organize a ordem pelas miniaturas.")}`;
  const drawings = `<div class="manager__subsection"><h4>Diagramas</h4><div class="manager__fields">${field("Software dos diagramas", "diagramSoftware", item?.diagramSoftware, 'maxlength="160" placeholder="Ex.: Revit"')}</div>${imageEditor(item, "diagrams", "Diagramas", "Estudos, esquemas e diagramas conceituais.")}</div><div class="manager__subsection"><h4>Desenhos técnicos</h4><div class="manager__fields">${field("Software dos desenhos técnicos", "renderSoftware", item?.renderSoftware, 'maxlength="160" placeholder="Ex.: Revit"')}</div>${imageEditor(item, "plans", "Desenhos técnicos", "Plantas, cortes, fachadas e detalhamentos.")}</div>`;
  root.innerHTML = `<main class="manager"><header class="manager__header"><a href="/">← Voltar ao portfólio</a><span>GABRIELA MORAES / PAINEL DE EDIÇÃO</span><a href="/signout-with-chatgpt?return_to=%2Fgerenciar" target="_top">Sair ↗</a></header>
  <div class="manager__intro"><div><p class="eyebrow">SEU PORTFÓLIO, DO SEU JEITO</p><h1>Gerenciar <em>projetos.</em></h1><p>Escolha um projeto, edite as informações e salve quando terminar.</p></div><div class="manager__guide"><span><b>01</b> Escolha o projeto</span><span><b>02</b> Edite textos e imagens</span><span><b>03</b> Salve as alterações</span></div></div>
  ${isLocalPreview ? '<div class="manager__notice"><strong>Você está na prévia local.</strong><span>As edições feitas aqui não alteram o site publicado.</span></div>' : ""}
  <div class="manager__tabs" role="tablist" aria-label="Tipo de projeto"><button role="tab" aria-selected="${academic}" data-kind="project" class="${academic ? "is-active" : ""}">Projetos acadêmicos <span>${entries.project.length}</span></button><button role="tab" aria-selected="${!academic}" data-kind="other" class="${!academic ? "is-active" : ""}">Outros projetos <span>${entries.other.length}</span></button></div>
  <div class="manager__grid"><aside class="manager__sidebar"><div class="manager__sidebar-head"><h2>Seus projetos</h2><span>${String(list.length).padStart(2,"0")}</span></div><button class="manager__new" data-new>+ Criar novo projeto</button><label class="manager__search">Buscar projeto<input type="search" placeholder="Digite o nome…" data-search></label><div class="manager__list">${list.map(entry=>`<button type="button" class="manager__item ${entry.slug===selectedSlug ? "is-active" : ""}" data-edit="${escape(entry.slug)}" ${entry.slug===selectedSlug ? 'aria-current="true"' : ""}><img src="${escape(entry.cover || entry.images?.[0]?.src || "")}" alt="" loading="lazy"><span><strong>${escape(entry.title)}</strong><small>${escape(entry.category || (academic ? "Projeto acadêmico" : entry.tool))}</small></span><i aria-hidden="true">↗</i></button>`).join("")}<p class="manager__no-results" hidden>Nenhum projeto encontrado.</p></div><p class="manager__sidebar-note">Selecione um projeto da lista ou crie um novo para começar.</p></aside>
  <section class="manager__editor" aria-label="Editor de projeto"><div class="manager__editor-head"><div><p class="eyebrow">${item ? "EDITANDO" : "NOVO PROJETO"} · ${academic ? "ACADÊMICO" : "OUTROS PROJETOS"}</p><h2>${item ? escape(item.title) : "Vamos criar um projeto"}</h2><p>Campos com <span class="manager__required">*</span> são obrigatórios.</p></div>${item ? `<a class="manager__view" href="/${academic ? "projetos" : "outros-projetos"}/${escape(item.slug)}/" target="_blank" rel="noopener">Ver no portfólio ↗</a>` : ""}</div>
  <nav class="manager__section-nav" aria-label="Seções do formulário"><a href="#manager-info">01 Informações</a><a href="#manager-images">02 Capa e renders</a><a href="#manager-drawings">03 Desenhos técnicos</a></nav>
  <form id="manager-form">${editorSection("01", "manager-info", "Informações do projeto", "Os textos que apresentam seu trabalho no portfólio.", info)}${editorSection("02", "manager-images", "Capa e renders", "Envie as imagens e organize a sequência de apresentação.", gallery)}${editorSection("03", "manager-drawings", "Desenhos técnicos", "Opcional. Esta parte só aparece no site quando houver conteúdo.", drawings)}
  <div class="manager__actions"><div><span class="manager__save-indicator" aria-hidden="true"></span><span role="status" id="manager-status">${escape(status || "Nenhuma alteração pendente.")}</span></div><button type="submit">Salvar alterações <span aria-hidden="true">↗</span></button></div></form>
  ${item ? `<details class="manager__danger"><summary>Remover este projeto</summary><p>O projeto e sua galeria deixarão de aparecer no portfólio. Esta ação precisa ser confirmada.</p><button type="button" class="manager__delete" data-delete>${confirmDelete ? "Confirmar exclusão do projeto" : "Excluir projeto"}</button>${confirmDelete ? '<p role="status">Clique novamente no botão para confirmar a exclusão.</p>' : ""}</details>` : ""}</section></div></main>`;
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
    const label = entry.kind === "saved" ? entry.image.label || "Imagem" : entry.file.name;
    const src = entry.kind === "saved" ? entry.image.src : URL.createObjectURL(entry.file);
    addPreview(src, label, () => { items.splice(index, 1); updateImageOrder(form, field); }, entry.kind === "file", index, items.length, entry);
  });
}

async function orderedImages(form, field) {
  const images = [];
  for (const entry of imageItems(form, field)) {
    images.push(entry.kind === "saved" ? entry.image : { label: entry.file.name.replace(/\.[^.]+$/, ""), src: await upload(entry.file), ...(entry.displayScale ? { displayScale: entry.displayScale } : {}) });
  }
  return images;
}

async function upload(file) {
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
