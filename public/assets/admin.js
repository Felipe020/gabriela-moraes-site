import { projects as baselineProjects } from "./data.js";
import { otherProjects as baselineOther } from "./other-projects.js";
import { normalizeProject } from "./project-normalize.js";

const root = document.querySelector("#admin-app");
const escape = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
let entries = { project: baselineProjects.map(normalizeProject), other: [...baselineOther] };
let currentKind = "project";
let selectedSlug = null;
let status = "";
let confirmDelete = false;
const imageStates = new WeakMap();
const imageFileFields = { images: "imageFiles", plans: "planFiles", diagrams: "diagramFiles", executiveImages: "executiveFiles" };

async function load() {
  entries = { project: baselineProjects.map(normalizeProject), other: [...baselineOther] };
  const response = await fetch("/api/items", { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível carregar os projetos.");
  const { items } = await response.json();
  for (const { kind, slug, item, deleted } of items) {
    const list = entries[kind];
    const index = list.findIndex((entry) => entry.slug === slug);
    if (deleted && index >= 0) list.splice(index, 1);
    else if (!deleted && index >= 0) list[index] = kind === "project" ? normalizeProject(item) : item;
    else if (!deleted) list.push(kind === "project" ? normalizeProject(item) : item);
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

function render() {
  const list = entries[currentKind];
  const item = list.find((entry) => entry.slug === selectedSlug);
  root.innerHTML = `<main class="manager"><header class="manager__header"><a href="/">← PORTFÓLIO</a><span>GABRIELA MORAES / GERENCIAR</span><a href="/signout-with-chatgpt?return_to=%2Fgerenciar" target="_top">SAIR</a></header>
    <div class="manager__intro"><p class="eyebrow">ÁREA DA PROPRIETÁRIA</p><h1>Gerenciar<br><em>projetos.</em></h1><p>Crie, edite e remova projetos. As alterações são publicadas no portfólio imediatamente.</p></div>
    <div class="manager__tabs" role="tablist"><button data-kind="project" class="${currentKind === "project" ? "is-active" : ""}">PROJETOS (${entries.project.length})</button><button data-kind="other" class="${currentKind === "other" ? "is-active" : ""}">OUTROS PROJETOS (${entries.other.length})</button></div>
    <div class="manager__grid"><aside class="manager__list"><button class="manager__new" data-new>+ NOVO PROJETO</button>${list.map((entry) => `<button class="manager__item ${entry.slug === selectedSlug ? "is-active" : ""}" data-edit="${escape(entry.slug)}"><span>${escape(entry.title)}</span><small>${escape(currentKind === "project" ? entry.category : entry.tool)}</small></button>`).join("")}</aside>
    <section class="manager__editor"><div class="manager__editor-head"><div><p class="eyebrow">${item ? "EDITAR" : "CRIAR"} / ${currentKind === "project" ? "PROJETOS" : "OUTROS PROJETOS"}</p><h2>${item ? escape(item.title) : "Novo projeto"}</h2></div>${item ? `<button class="manager__delete" data-delete>${confirmDelete ? "CONFIRMAR EXCLUSÃO" : "EXCLUIR"}</button>` : ""}</div>
      <form id="manager-form"><div class="manager__fields"><label>TÍTULO<input name="title" value="${escape(item?.title || "")}" required maxlength="160"></label><label>ENDEREÇO DA PÁGINA<input name="slug" value="${escape(item?.slug || "")}" ${item ? "readonly" : ""} required pattern="[a-z0-9]+(-[a-z0-9]+)*"><small>Gerado do título; pode ser ajustado antes de salvar.</small></label>
      ${currentKind === "project" ? `<label>CATEGORIA<input name="category" value="${escape(item?.category || "")}" required></label><label>ANO<input name="year" value="${escape(item?.year || "")}"></label><label>LOCAL<input name="location" value="${escape(item?.location || "")}"></label><label>DISCIPLINA<input name="discipline" value="${escape(item?.discipline || "")}"></label><label>SOFTWARE DAS PLANTAS<input name="renderSoftware" value="${escape(item?.renderSoftware || "")}" maxlength="160" placeholder="Ex.: Revit"></label><label>SOFTWARE DOS DIAGRAMAS<input name="diagramSoftware" value="${escape(item?.diagramSoftware || "")}" maxlength="160" placeholder="Ex.: Revit"></label><label>SOFTWARE DAS FOTOS<input name="photoSoftware" value="${escape(item?.photoSoftware || "")}" maxlength="160" placeholder="Ex.: Enscape"></label><label class="manager__full">DESCRIÇÃO<textarea name="description" rows="6" placeholder="Um parágrafo por linha">${escape(item?.description?.join("\n") || "")}</textarea></label><label class="manager__full">CAPA<input name="cover" value="${escape(item?.cover || "")}" placeholder="URL da imagem"><input name="coverFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif"><small>Envie uma imagem ou cole uma URL HTTPS.</small><span class="manager__previews" data-previews="cover"></span></label><label class="manager__full">DIAGRAMAS<textarea name="diagrams" rows="4" placeholder="Nome | URL, uma por linha">${escape(imageLines(item?.diagrams || [], "diagrams"))}</textarea><span class="manager__previews" data-previews="diagrams"></span></label><label class="manager__full">ENVIAR DIAGRAMAS<input name="diagramFiles" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple></label><label class="manager__full">PLANTAS TÉCNICAS<textarea name="plans" rows="4" placeholder="Nome | URL, uma por linha">${escape(imageLines(item?.plans || [], "plans"))}</textarea><span class="manager__previews" data-previews="plans"></span></label><label class="manager__full">ENVIAR PLANTAS<input name="planFiles" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple></label>` : `<label>SOFTWARE UTILIZADO<input name="tool" value="${escape(item?.tool || "")}" required placeholder="Ex.: Enscape"></label>`}
      <label class="manager__full">IMAGENS DA GALERIA<textarea name="images" rows="7" placeholder="Nome | URL, uma por linha">${escape(imageLines(item?.images || []))}</textarea><small>A primeira imagem será a capa em Outros projetos.</small><span class="manager__previews" data-previews="images"></span></label><label class="manager__full">ENVIAR IMAGENS<input name="imageFiles" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple></label>
      ${currentKind === "other" ? `<label class="manager__full">SOBRE O PROJETO (OPCIONAL)<textarea name="description" rows="6" maxlength="5000" placeholder="Escreva sobre o projeto, se desejar">${escape(item?.description || "")}</textarea></label><label>SOFTWARE DOS DESENHOS TÉCNICOS<input name="executiveSoftware" value="${escape(item?.executiveSoftware || "")}" maxlength="160" placeholder="Ex.: Revit"></label><label class="manager__full">PROJETO EXECUTIVO<textarea name="executiveImages" rows="4" placeholder="Nome | URL, uma por linha">${escape(imageLines(item?.executiveImages || []))}</textarea><small>Esta seção só aparecerá no projeto quando houver imagens.</small><span class="manager__previews" data-previews="executiveImages"></span></label><label class="manager__full">ENVIAR IMAGENS DO PROJETO EXECUTIVO<input name="executiveFiles" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple></label>` : ""}</div>
      <div class="manager__actions"><button type="submit">SALVAR PROJETO ↗</button><span role="status" id="manager-status">${escape(status)}</span></div></form></section></div></main>`;
  root.querySelectorAll("[data-kind]").forEach((button) => button.addEventListener("click", () => { currentKind = button.dataset.kind; selectedSlug = null; status = ""; confirmDelete = false; render(); }));
  root.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => { selectedSlug = button.dataset.edit; status = ""; confirmDelete = false; render(); }));
  root.querySelector("[data-new]").addEventListener("click", () => { selectedSlug = null; status = ""; confirmDelete = false; render(); });
  root.querySelector("[data-delete]")?.addEventListener("click", () => { if (!confirmDelete) { confirmDelete = true; status = "Clique novamente para excluir este projeto."; render(); } else remove(); });
  const form = root.querySelector("#manager-form");
  form.elements.title.addEventListener("input", () => { if (!selectedSlug) form.elements.slug.value = slugify(form.elements.title.value); });
  setupImagePreviews(form);
  form.addEventListener("submit", save);
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
    if (currentKind === "project") {
      item.category = String(values.get("category") || "").trim();
      item.year = String(values.get("year") || "").trim();
      item.location = String(values.get("location") || "").trim();
      item.discipline = String(values.get("discipline") || "").trim();
      item.renderSoftware = String(values.get("renderSoftware") || "").trim();
      item.diagramSoftware = String(values.get("diagramSoftware") || "").trim();
      item.photoSoftware = String(values.get("photoSoftware") || "").trim();
      item.description = String(values.get("description") || "").split("\n").map((line) => line.trim()).filter(Boolean);
      if (!form.elements.coverFile.files[0] && !String(values.get("cover") || "").trim()) throw new Error("Adicione uma imagem de capa.");
      item.cover = form.elements.coverFile.files[0] ? await upload(form.elements.coverFile.files[0]) : String(values.get("cover") || "").trim();
      item.plans = await orderedImages(form, "plans");
      item.diagrams = await orderedImages(form, "diagrams");
    } else {
      item.tool = String(values.get("tool") || "").trim();
      item.description = String(values.get("description") || "").trim();
      item.executiveSoftware = String(values.get("executiveSoftware") || "").trim();
      item.executiveImages = await orderedImages(form, "executiveImages");
    }
    const response = await fetch("/api/items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: currentKind, slug, item }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Não foi possível salvar.");
    selectedSlug = slug; status = "Projeto salvo."; await load();
  } catch (error) { output.textContent = error.message; button.disabled = false; }
}

async function remove() {
  const item = entries[currentKind].find((entry) => entry.slug === selectedSlug);
  if (!item) return;
  const response = await fetch("/api/items", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: currentKind, slug: selectedSlug }) });
  if (!response.ok) { status = "Não foi possível excluir."; render(); return; }
  selectedSlug = null; confirmDelete = false; status = "Projeto excluído."; await load();
}

load().catch((error) => { root.innerHTML = `<main class="manager"><h1>Não foi possível abrir o gerenciador.</h1><p>${escape(error.message)}</p><a href="/">Voltar ao portfólio</a></main>`; });
