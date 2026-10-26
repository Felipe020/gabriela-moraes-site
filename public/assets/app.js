import { profile, experiences, software, projects as initialProjects } from "./data.js";
import { otherProjects as initialOtherProjects } from "./other-projects.js";
import { normalizeProject } from "./project-normalize.js";

let projects = initialProjects.map(normalizeProject);
let otherProjects = [...initialOtherProjects];
try {
  const response = await fetch("/api/items", { cache: "no-store" });
  if (response.ok) {
    const { items } = await response.json();
    for (const { kind, slug, item, deleted } of items) {
      const collection = kind === "project" ? projects : otherProjects;
      const index = collection.findIndex((entry) => entry.slug === slug);
      if (deleted && index >= 0) collection.splice(index, 1);
      else if (!deleted && index >= 0) collection[index] = kind === "project" ? normalizeProject(item) : item;
      else if (!deleted) collection.push(kind === "project" ? normalizeProject(item) : item);
    }
  }
} catch (error) { console.error("Não foi possível carregar os projetos.", error); }

const root = document.querySelector("#app");
const href = (project) => `/projetos/${project.slug}/`;
const escapeText = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

function imageFrame({ src, label, number = "", alt = "", fit = "cover", shape = "wide", eager = false, portrait = false, width, height, hideOverlay = false }) {
  return `<figure class="image-frame image-frame--${shape}${portrait ? " image-frame--portrait" : ""}" data-image-frame>
    ${hideOverlay ? "" : `<span class="image-frame__grid" aria-hidden="true"></span><span class="image-frame__placeholder" aria-hidden="true"><span class="image-frame__marker">${number || "GM"}</span><span class="image-frame__label">${label}</span><span class="image-frame__cross">+</span></span>`}
    <img src="${src}" alt="${alt}"${width && height ? ` width="${width}" height="${height}"` : ""} loading="${eager ? "eager" : "lazy"}" decoding="async" class="image-frame__img image-frame__img--${fit}" />
  </figure>`;
}

function nav(isProject = false) {
  const p = isProject ? "/" : "";
  return `<div id="topo" aria-hidden="true"></div><a class="skip-link" href="#main">Ir para o conteúdo</a>
  <header class="site-header">
    <div class="site-header__inner container">
      <a class="brand" href="${p}#topo" aria-label="Gabriela Moraes, voltar ao início">GABRIELA <strong>MORAES</strong></a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">MENU <span class="menu-toggle__icon" aria-hidden="true"><i></i><i></i></span></button>
      <nav class="site-nav" id="site-nav" aria-label="Navegação principal">
        <a href="${p}#sobre">Sobre</a><a href="${p}#experiencias">Experiências</a><a href="${p}#projetos">Projetos</a><a href="${p}#renders">Outros projetos</a><a href="${p}#contato">Contato</a>
      </nav>
    </div>
  </header>`;
}

function sectionMarker(number, title) {
  return `<div class="section-marker"><span>${number} / 05</span><span>${title}</span></div>`;
}

function hero() {
  const first = projects[0];
  return `<section class="hero container" aria-labelledby="hero-title">
    <div class="hero__eyebrow"><span>PORTFÓLIO</span><span>ARQUITETURA + URBANISMO</span><span>2026</span></div>
    <div class="hero__body">
    <div class="hero__copy"><p class="hero__index">01 / ${String(projects.length).padStart(2, "0")} <span class="hairline"></span> ARQ + URB</p><h1 id="hero-title">GABRIELA<br /><span>MORAES</span></h1><p class="hero__profession">Arquitetura &amp; Urbanismo</p><a class="text-link hero__explore" href="#projetos">EXPLORAR PROJETOS <span aria-hidden="true">↘</span></a></div>
      ${first ? `<a class="hero__visual visual-link" href="${href(first)}" aria-label="Conhecer ${first.title}">
        ${imageFrame({ src: first.cover, label: "CAPA DO PROJETO", number: "01", alt: `Capa do projeto ${first.title}`, fit: "contain", shape: "hero", eager: true })}
        <div class="hero__visual-caption"><span>PROJETO EM DESTAQUE</span><span>${first.title.toUpperCase()} <span aria-hidden="true">↗</span></span></div>
      </a>` : ""}
    </div>
  </section>`;
}

function about() {
  return `<section class="about section-pad" id="sobre" aria-labelledby="about-title"><div class="container">
    ${sectionMarker("01", "SOBRE MIM")}
    <div class="about__grid"><div class="about__photo">${imageFrame({ src: profile.profileImage, label: "FOTO PROFISSIONAL", number: "GM", alt: "Retrato de Gabriela Moraes", shape: "profile", portrait: true })}<span class="about__photo-caption">GABRIELA SOUZA MORAES <span>JUIZ DE FORA — MG</span></span></div>
      <div class="about__content"><p class="eyebrow">ARQUITETURA + URBANISMO</p><h2 id="about-title">Sobre mim<span class="heading-period">.</span></h2><div class="about__text"><p>Sou estudante do 8º período de Arquitetura e Urbanismo na UniAcademia, em Juiz de Fora. Tenho interesse em projeto executivo, detalhamento e renderização, áreas nas quais busco me aprimorar constantemente, assim como nos diferentes aspectos da arquitetura.</p><p>Gosto de entender como as coisas funcionam e acredito que um bom projeto também depende da capacidade de transmitir informações de forma clara. Procuro desenvolver soluções criativas, funcionais e bem pensadas, sempre com atenção aos detalhes e à qualidade do resultado.</p></div>
        <div class="about__education"><span>FORMAÇÃO</span><div><strong>${profile.degree}</strong><small>${profile.institution}<br />${profile.educationPeriod} / ${profile.currentSemester}</small></div></div>
      </div>
    </div><div class="about__keywords" aria-label="Áreas de interesse"><span>PROJETO EXECUTIVO</span><b>/</b><span>DETALHAMENTO</span><b>/</b><span>MODELAGEM 3D</span><b>/</b><span>RENDERIZAÇÃO</span><b>/</b><span>ARQUITETURA</span><b>/</b><span>URBANISMO</span></div>
  </div></section>`;
}

function experience() {
  return `<section class="experience section-pad" id="experiencias" aria-labelledby="experience-title"><div class="container">${sectionMarker("02", "TRAJETÓRIA")}
    <div class="experience__heading"><h2 id="experience-title">Experiências<span class="heading-period">.</span></h2><p>Prática em diferentes escalas do projeto arquitetônico.</p></div>
    <div class="experience__list">${experiences.map((e, i) => `<div class="experience__row"><span class="experience__number">0${i + 1}</span><span class="experience__period">${e.period}</span><span class="experience__studio"><strong>${e.studio}</strong><small>${e.role}</small></span></div>`).join("")}</div>
  </div></section>`;
}

function softwareSection() {
  return `<section class="software-section" aria-labelledby="software-title"><div class="container software-section__grid"><div><span class="eyebrow">FERRAMENTAS DE TRABALHO</span><h2 id="software-title">Do desenho<br />à visualização<span class="heading-period">.</span></h2></div><ol class="software-list">${software.map((name, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span><strong>${name}</strong></li>`).join("")}</ol></div></section>`;
}

function projectCard(project, index) {
  return `<a class="project-card project-card--${index + 1} visual-link" href="${href(project)}" aria-label="Conhecer ${project.title}">
    ${imageFrame({ src: project.cover, label: "CAPA DO PROJETO", number: project.id, alt: `Capa do projeto ${project.title}`, fit: "contain", shape: "landscape" })}
    <div class="project-card__info"><span class="project-card__number">${project.id} / ${String(projects.length).padStart(2, "0")}</span><div><h3>${project.title}</h3><p>${project.category}</p></div><span class="project-card__arrow" aria-hidden="true">↗</span></div><div class="project-card__meta"><span>${project.location || ""}</span><span>${project.year || ""}</span></div>
  </a>`;
}

function projectsSection() {
  return `<section class="projects section-pad" id="projetos" aria-labelledby="projects-title" data-carousel><div class="container">${sectionMarker("03", "SELECTED WORKS")}
    <div class="projects__heading"><h2 id="projects-title">PROJETOS<br /><span class="projects__heading-light">ACADÊMICOS</span><span class="heading-period">.</span></h2><div><span>ARQUITETURA + URBANISMO</span><span>2024 — 2026</span></div></div>
    <div class="projects__carousel-head"><p>DESLIZE PARA EXPLORAR <span aria-hidden="true">→</span></p><div class="projects__controls"><span class="projects__counter" data-carousel-counter aria-live="polite">01 / ${String(projects.length).padStart(2, "0")}</span><button type="button" class="carousel-button" data-carousel-prev aria-label="Projeto anterior">←</button><button type="button" class="carousel-button" data-carousel-next aria-label="Próximo projeto">→</button></div></div>
    <div class="projects__track" data-carousel-track tabindex="0" aria-label="Carrossel de projetos">${projects.map(projectCard).join("")}</div>
    <div class="projects__end"><span>${String(projects.length).padStart(2, "0")} PROJETOS</span><span>PORTFÓLIO / 2026</span></div>
  </div></section>`;
}

function rendersSection() {
  return `<section class="renders section-pad" id="renders" aria-labelledby="renders-title" data-carousel><div class="container">
    <div class="renders__heading"><div><p class="eyebrow">SELEÇÃO COMPLEMENTAR</p><h2 id="renders-title">OUTROS<br /><span>PROJETOS.</span></h2></div><p>Ambientes e estudos de visualização organizados por projeto e ferramenta.</p></div>
    <div class="projects__carousel-head renders__carousel-head"><p>DESLIZE PARA EXPLORAR <span aria-hidden="true">→</span></p><div class="projects__controls"><span class="projects__counter" data-carousel-counter aria-live="polite">01 / ${String(otherProjects.length).padStart(2, "0")}</span><button type="button" class="carousel-button" data-carousel-prev aria-label="Projeto anterior">←</button><button type="button" class="carousel-button" data-carousel-next aria-label="Próximo projeto">→</button></div></div>
    <div class="projects__track renders__track" data-carousel-track tabindex="0" aria-label="Carrossel de outros projetos">${otherProjects.map((item) => `<a class="render-item other-project-card" href="/outros-projetos/${item.slug}/"${item.images[0].width && item.images[0].height ? ` style="--preview-aspect:${item.images[0].width / item.images[0].height}"` : ""} aria-label="Ver ${item.title}, ${item.images.length} imagens feitas com ${item.tool}">${imageFrame({ src: item.images[0].src, label: item.title.toUpperCase(), number: item.id, alt: `${item.title}, visualização com ${item.tool}`, fit: "contain", shape: "landscape", width: item.images[0].width, height: item.images[0].height })}<span class="other-project-card__meta"><strong>${item.title}</strong><small>${item.tool.toUpperCase()} · ${String(item.images.length).padStart(2, "0")} IMAGENS <span aria-hidden="true">↗</span></small></span></a>`).join("")}</div>
  </div></section>`;
}

function contact() {
  return `<section class="contact section-pad" id="contato" aria-labelledby="contact-title"><div class="container">${sectionMarker("05", "CONTATO")}
    <div class="contact__heading"><h2 id="contact-title">VAMOS<br /><span>CONVERSAR?</span></h2></div>
    <div class="contact__grid"><div class="contact__details"><p>${profile.name}<br />${profile.city}</p><div class="contact__line"><span>E-MAIL</span><a href="mailto:${profile.email}">${profile.email} <span aria-hidden="true">↗</span></a></div><div class="contact__line"><span>TELEFONE</span><a href="tel:${profile.phoneHref}">${profile.phone} <span aria-hidden="true">↗</span></a></div><div class="contact__line"><span>REDES</span><div class="social-links"><a href="${profile.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Gabriela Moraes, abre em nova aba">INSTAGRAM ↗</a><a href="${profile.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn de Gabriela Moraes, abre em nova aba">LINKEDIN ↗</a></div></div></div>
    <form class="contact-form" id="contact-form"><p>Envie uma mensagem</p><label for="contact-name">NOME</label><input id="contact-name" name="name" autocomplete="name" required /><label for="contact-email">E-MAIL</label><input id="contact-email" name="email" type="email" autocomplete="email" required /><label for="contact-message">MENSAGEM</label><textarea id="contact-message" name="message" rows="3" required></textarea><button class="submit-button" type="submit">PREPARAR E-MAIL <span aria-hidden="true">↗</span></button><p class="form-note" id="form-note" role="status">O envio é concluído no seu aplicativo de e-mail.</p></form></div>
  </div></section>`;
}

function footer() {
  const aboutHref = document.body.dataset.page === "home" ? "#sobre" : "/#sobre";
  return `<footer class="footer"><div class="container footer__grid"><div><strong>GABRIELA MORAES</strong><span>ARQUITETURA + URBANISMO</span></div><span>JUIZ DE FORA — MG</span><span>© 2026 GABRIELA MORAES</span><span class="footer__actions"><a href="${aboutHref}">↑ &nbsp; VOLTAR AO SOBRE</a></span></div></footer>`;
}

function homePage() {
  root.innerHTML = `${nav()}<main id="main">${hero()}${about()}${experience()}${softwareSection()}${projectsSection()}${rendersSection()}${contact()}</main>${footer()}`;
}

function drawingsSection(project, type) {
  const diagrams = type === "diagrams";
  const images = project[type] || [];
  const software = diagrams ? project.diagramSoftware : project.renderSoftware;
  if (!images.length && (diagrams || !software)) return "";
  const title = diagrams ? "Diagramas" : "Desenhos Técnicos";
  const titleId = diagrams ? "diagrams-title" : "plans-title";
  return `<section class="detail-plans" aria-labelledby="${titleId}">
    <div class="detail-plans__heading"><div>${diagrams ? '<span class="eyebrow">ESTUDOS VISUAIS</span>' : ""}<h2 id="${titleId}">${title}<span class="heading-period">.</span></h2></div>${software ? `<div class="detail-plans__credit"><span>FEITO NO</span><strong>${escapeText(software)}</strong></div>` : ""}</div>
    <div class="detail-plans__grid">${images.map((plan, index) => {
      const legacyWidth = Number(plan.displayWidth);
      const hasLegacyWidth = Number.isInteger(legacyWidth) && legacyWidth >= 30 && legacyWidth <= 100;
      const savedScale = Number(plan.displayScale);
      const scale = Number.isInteger(savedScale) && savedScale >= 10 && savedScale <= 300 ? savedScale : 100;
      const adjustedWidth = hasLegacyWidth ? legacyWidth * scale / 100 : scale;
      const defaultFullRow = !hasLegacyWidth && plan.shape !== "plan-portrait" && index === images.length - 1 && index % 2 === 0;
      const sized = hasLegacyWidth || (scale !== 100 && defaultFullRow);
      const compact = hasLegacyWidth && adjustedWidth <= 50;
      const relativeColumn = !hasLegacyWidth && !defaultFullRow && scale < 100;
      const relativeWide = !hasLegacyWidth && !defaultFullRow && scale > 100;
      const widthStyle = sized ? `--drawing-width:${adjustedWidth}%;--drawing-column-width:${adjustedWidth * 2}%` : relativeColumn ? `--drawing-column-width:${scale}%` : relativeWide ? `--drawing-width:${scale / 2}%;--drawing-mobile-width:${scale}%` : "";
      return `<a class="detail-plans__item detail-plans__item--${plan.shape || "plan"}${sized ? " detail-plans__item--sized" : ""}${compact ? " detail-plans__item--compact" : ""}${relativeColumn ? " detail-plans__item--relative-column" : ""}${relativeWide ? " detail-plans__item--relative-wide" : ""}"${widthStyle ? ` style="${widthStyle}"` : ""} href="${plan.src}" data-lightbox aria-label="Ampliar ${escapeText(plan.label)} de ${escapeText(project.title)} no visualizador">
      ${imageFrame({ src: plan.src, label: plan.label.toUpperCase(), alt: `${plan.label} de ${project.title}`, fit: "contain", shape: plan.shape || "plan", width: plan.width, height: plan.height, hideOverlay: true })}
      <span>${escapeText(plan.label)} <span aria-hidden="true">↗</span></span>
    </a>`; }).join("")}</div>
  </section>`;
}

function detailPage(project) {
  document.title = `${project.title} — Gabriela Moraes`;
  const paragraphs = Array.isArray(project.description) ? project.description : [project.description || "Texto e informações adicionais sobre o projeto serão incluídos nesta etapa de apresentação."];
  root.innerHTML = `${nav(true)}<main id="main" class="detail-page"><div class="container">
    <a class="back-link" href="/#projetos"><span aria-hidden="true">←</span> VOLTAR AOS PROJETOS</a>
    <div class="detail-heading detail-heading--project">
      <a class="detail-heading__cover" href="${project.cover}" data-lightbox aria-label="Ampliar capa de ${escapeText(project.title)} no visualizador"><img src="${project.cover}" alt="Capa do projeto ${escapeText(project.title)}" loading="eager" decoding="async" /></a>
      <div class="detail-heading__content"><p>${project.id} / ${project.category.toUpperCase()}</p><h1>${project.title}</h1><div class="detail-heading__meta">${project.location ? `<span>${project.location}</span>` : ""}${project.year ? `<span>${project.year}</span>` : ""}</div></div>
    </div>
    <div class="detail-intro"><div><span class="eyebrow">SOBRE O PROJETO</span><h2>Uma leitura<br />do projeto<span class="heading-period">.</span></h2></div><div class="detail-intro__body">${paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}</div></div>
    <div class="detail-facts"><span>FICHA TÉCNICA</span><dl><div><dt>PROJETO</dt><dd>${project.title}</dd></div><div><dt>CATEGORIA</dt><dd>${project.category}</dd></div>${project.location ? `<div><dt>LOCAL</dt><dd>${project.location}</dd></div>` : ""}${project.year ? `<div><dt>ANO</dt><dd>${project.year}</dd></div>` : ""}${project.discipline ? `<div><dt>DISCIPLINA</dt><dd>${project.discipline}</dd></div>` : ""}</dl></div>
    ${drawingsSection(project, "diagrams")}
    ${drawingsSection(project, "plans")}
    ${project.photoSoftware ? `<div class="detail-photos__credit"><span>RENDERIZADO POR</span><strong>${escapeText(project.photoSoftware)}</strong></div>` : ""}
    <a class="detail-hero-link" href="${project.cover}" data-lightbox aria-label="Ampliar capa de ${escapeText(project.title)} no visualizador">${imageFrame({ src: project.cover, label: "CAPA DO PROJETO", number: project.id, alt: `Render principal do projeto ${project.title}`, shape: "detail-hero", eager: true })}</a>
    <div class="detail-gallery">${project.images.map((im, i) => `<div class="detail-gallery__item detail-gallery__item--${i + 1}"><a class="detail-gallery__link" href="${im.src}" data-lightbox aria-label="Ampliar ${escapeText(im.label)} de ${escapeText(project.title)} no visualizador">${imageFrame({ src: im.src, label: im.label.toUpperCase(), number: String(i + 1).padStart(2, "0"), alt: `${im.label} de ${project.title}`, fit: im.fit, shape: im.shape })}</a><span>${String(i + 1).padStart(2, "0")} / ${String(project.images.length).padStart(2, "0")}</span></div>`).join("")}</div>
    <div class="detail-next">${(() => { const next = projects[(projects.indexOf(project) + 1) % projects.length]; return `<span>PRÓXIMO PROJETO</span><a href="${href(next)}">${next.title}<span aria-hidden="true">↗</span></a>`; })()}</div>
  </div></main>${footer()}`;
}

function otherProjectPage(item) {
  document.title = `${item.title} — Gabriela Moraes`;
  const next = otherProjects[(otherProjects.indexOf(item) + 1) % otherProjects.length];
  const imageLabel = (index) => `Imagem ${String(index + 1).padStart(2, "0")} de ${item.title}`;
  root.innerHTML = `${nav(true)}<main id="main" class="detail-page other-detail"><div class="container">
    <a class="back-link" href="/#renders"><span aria-hidden="true">←</span> VOLTAR A OUTROS PROJETOS</a>
    <div class="detail-heading"><p>${item.id} / ${String(otherProjects.length).padStart(2, "0")} · VISUALIZAÇÃO COM ${item.tool.toUpperCase()}</p><h1>${item.title}</h1><div><span>${String(item.images.length).padStart(2, "0")} IMAGENS</span></div></div>
    ${item.description?.trim() ? `<section class="other-detail__description" aria-label="Sobre o projeto"><span class="eyebrow">SOBRE O PROJETO</span><p>${escapeText(item.description.trim())}</p></section>` : ""}
    ${item.executiveImages?.length ? `<section class="other-detail__executive" aria-labelledby="executive-title"><div class="other-detail__executive-head"><div><span class="eyebrow">DESENHOS TÉCNICOS</span><h2 id="executive-title">Projeto executivo<span class="heading-period">.</span></h2></div>${item.executiveSoftware?.trim() ? `<div class="detail-plans__credit"><span>FEITO NO</span><strong>${escapeText(item.executiveSoftware.trim())}</strong></div>` : ""}</div><div class="other-detail__executive-grid">${item.executiveImages.map((image, index) => `<a class="other-detail__image" href="${image.src}" data-lightbox aria-label="Ampliar ${escapeText(image.label || `imagem ${index + 1}`)} do projeto executivo no visualizador"><img src="${image.src}" alt="${escapeText(image.label || `Imagem ${index + 1}`)} do projeto executivo de ${escapeText(item.title)}" loading="lazy" decoding="async" /><span>${escapeText(image.label || `Imagem ${index + 1}`)} <span aria-hidden="true">↗</span></span></a>`).join("")}</div></section>` : ""}
    ${item.tool ? `<div class="detail-photos__credit"><span>RENDERIZADO POR</span><strong>${escapeText(item.tool)}</strong></div>` : ""}
    <a class="other-detail__hero" href="${item.images[0].src}" data-lightbox aria-label="Ampliar ${imageLabel(0)} no visualizador"><img src="${item.images[0].src}" alt="${imageLabel(0)}, visualização com ${item.tool}"${item.images[0].width && item.images[0].height ? ` width="${item.images[0].width}" height="${item.images[0].height}"` : ""} fetchpriority="high" /></a>
    <div class="other-detail__gallery-head"><span class="eyebrow">GALERIA · ${item.tool.toUpperCase()}</span><h2>Imagens<span class="heading-period">.</span></h2></div>
    <div class="other-detail__gallery">${item.images.slice(1).map((image, index) => `<a class="other-detail__image" href="${image.src}" data-lightbox aria-label="Ampliar ${imageLabel(index + 1)} no visualizador"><img src="${image.src}" alt="${imageLabel(index + 1)}, visualização com ${item.tool}"${image.width && image.height ? ` width="${image.width}" height="${image.height}"` : ""} loading="lazy" decoding="async" /><span>${String(index + 2).padStart(2, "0")} / ${String(item.images.length).padStart(2, "0")} <span aria-hidden="true">↗</span></span></a>`).join("")}</div>
    <div class="detail-next"><span>PRÓXIMO EM OUTROS PROJETOS</span><a href="/outros-projetos/${next.slug}/">${next.title}<span aria-hidden="true">↗</span></a></div>
  </div></main>${footer()}`;
}

function setupLightbox() {
  const links = [...root.querySelectorAll("a[data-lightbox]")];
  if (!links.length) return;
  const gallery = [...new Map(links.map((link) => [link.href, link])).values()];
  const modal = document.createElement("div");
  modal.className = "lightbox";
  modal.hidden = true;
  modal.innerHTML = `<div class="lightbox__dialog" role="dialog" aria-modal="true" aria-label="Visualizador de imagem">
    <div class="lightbox__toolbar"><span class="lightbox__caption"></span><div class="lightbox__controls">
      <button type="button" data-zoom-out aria-label="Diminuir zoom">−</button>
      <button type="button" data-zoom-reset aria-label="Restaurar zoom">100%</button>
      <button type="button" data-zoom-in aria-label="Aumentar zoom">+</button>
      <button type="button" data-close aria-label="Fechar imagem">×</button>
    </div></div>
    <div class="lightbox__stage"><img alt="" draggable="false" />
      <button type="button" class="lightbox__arrow lightbox__arrow--prev" data-prev aria-label="Imagem anterior deste projeto">‹</button>
      <button type="button" class="lightbox__arrow lightbox__arrow--next" data-next aria-label="Próxima imagem deste projeto">›</button>
    </div>
    <p class="lightbox__hint"><span class="lightbox__count" aria-live="polite"></span> Use as setas para navegar pelas imagens do projeto. Use os botões, a roda do mouse ou pinça para ampliar; arraste para mover.</p>
  </div>`;
  document.body.append(modal);
  const stage = modal.querySelector(".lightbox__stage");
  const image = stage.querySelector("img");
  const caption = modal.querySelector(".lightbox__caption");
  const count = modal.querySelector(".lightbox__count");
  const resetButton = modal.querySelector("[data-zoom-reset]");
  const closeButton = modal.querySelector("[data-close]");
  const prevButton = modal.querySelector("[data-prev]");
  const nextButton = modal.querySelector("[data-next]");
  const pointers = new Map();
  let trigger = null;
  let currentIndex = 0;
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let pinchStart = null;

  function updateTransform() {
    const styles = getComputedStyle(stage);
    const viewWidth = stage.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    const viewHeight = stage.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
    const maxX = scale > 1 ? Math.abs(image.offsetWidth * scale - viewWidth) / 2 : 0;
    const maxY = scale > 1 ? Math.abs(image.offsetHeight * scale - viewHeight) / 2 : 0;
    panX = Math.max(-maxX, Math.min(maxX, panX));
    panY = Math.max(-maxY, Math.min(maxY, panY));
    image.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`;
    resetButton.textContent = `${Math.round(scale * 100)}%`;
    stage.classList.toggle("is-zoomed", scale > 1);
    modal.querySelector("[data-zoom-out]").disabled = scale <= 1;
    modal.querySelector("[data-zoom-in]").disabled = scale >= 8;
  }

  function setZoom(value, clientX, clientY) {
    const nextScale = Math.max(1, Math.min(8, value));
    const stageRect = stage.getBoundingClientRect();
    const anchorX = (clientX ?? stageRect.left + stageRect.width / 2) - stageRect.left - stageRect.width / 2;
    const anchorY = (clientY ?? stageRect.top + stageRect.height / 2) - stageRect.top - stageRect.height / 2;
    panX = anchorX - (anchorX - panX) * nextScale / scale;
    panY = anchorY - (anchorY - panY) * nextScale / scale;
    scale = nextScale;
    if (scale === 1) panX = panY = 0;
    updateTransform();
  }

  function close() {
    modal.hidden = true;
    document.body.classList.remove("lightbox-open");
    pointers.clear();
    image.removeAttribute("src");
    trigger?.focus();
  }

  function showImage(index) {
    currentIndex = (index + gallery.length) % gallery.length;
    const link = gallery[currentIndex];
    caption.textContent = link.querySelector("img")?.alt || "Imagem do projeto";
    count.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(gallery.length).padStart(2, "0")}`;
    image.alt = caption.textContent;
    image.src = link.href;
    pointers.clear();
    pinchStart = null;
    scale = 1; panX = panY = 0;
    updateTransform();
  }

  prevButton.hidden = nextButton.hidden = gallery.length < 2;

  links.forEach((link) => link.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    trigger = link;
    modal.hidden = false;
    document.body.classList.add("lightbox-open");
    showImage(gallery.findIndex((item) => item.href === link.href));
    closeButton.focus();
  }));
  image.addEventListener("load", updateTransform);
  prevButton.addEventListener("click", () => showImage(currentIndex - 1));
  nextButton.addEventListener("click", () => showImage(currentIndex + 1));
  modal.querySelector("[data-zoom-out]").addEventListener("click", () => setZoom(scale / 1.4));
  modal.querySelector("[data-zoom-in]").addEventListener("click", () => setZoom(scale * 1.4));
  resetButton.addEventListener("click", () => setZoom(1));
  closeButton.addEventListener("click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  stage.addEventListener("dblclick", () => setZoom(scale === 1 ? 2 : 1));
  stage.addEventListener("wheel", (event) => {
    event.preventDefault();
    setZoom(scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15), event.clientX, event.clientY);
  }, { passive: false });
  stage.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale };
    }
  });
  stage.addEventListener("pointermove", (event) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && pinchStart?.distance) {
      const [a, b] = [...pointers.values()];
      setZoom(pinchStart.scale * Math.hypot(a.x - b.x, a.y - b.y) / pinchStart.distance, (a.x + b.x) / 2, (a.y + b.y) / 2);
    } else if (pointers.size === 1 && scale > 1) {
      panX += event.clientX - previous.x;
      panY += event.clientY - previous.y;
      updateTransform();
    }
  });
  const releasePointer = (event) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchStart = null;
  };
  stage.addEventListener("pointerup", releasePointer);
  stage.addEventListener("pointercancel", releasePointer);
  window.addEventListener("resize", () => { if (!modal.hidden) updateTransform(); });
  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") { close(); return; }
    if (gallery.length > 1 && event.key === "ArrowLeft") { event.preventDefault(); showImage(currentIndex - 1); return; }
    if (gallery.length > 1 && event.key === "ArrowRight") { event.preventDefault(); showImage(currentIndex + 1); return; }
    if (event.key === "+" || event.key === "=") { event.preventDefault(); setZoom(scale * 1.4); }
    if (event.key === "-") { event.preventDefault(); setZoom(scale / 1.4); }
    if (event.key === "0") { event.preventDefault(); setZoom(1); }
    if (scale > 1 && ["ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "ArrowUp") panY += 60;
      if (event.key === "ArrowDown") panY -= 60;
      updateTransform();
    }
    if (event.key === "Tab") {
      const buttons = [...modal.querySelectorAll("button:not([hidden])")];
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
    }
  });
}

const path = location.pathname.split("/").filter(Boolean);
const slug = path[0] === "projetos" ? path[1] : null;
const project = projects.find((item) => item.slug === slug);
if (slug && project) detailPage(project);
else if (path[0] === "outros-projetos" && path[1]) {
  const item = otherProjects.find((entry) => entry.slug === path[1]);
  if (item) otherProjectPage(item);
  else root.innerHTML = `${nav(true)}<main id="main" class="container detail-page"><h1>Projeto não encontrado</h1><a href="/#renders">Voltar a outros projetos</a></main>${footer()}`;
}
else if (slug) root.innerHTML = `${nav(true)}<main id="main" class="container detail-page"><h1>Projeto não encontrado</h1><a href="/#projetos">Voltar aos projetos</a></main>${footer()}`;
else homePage();

setupLightbox();

if (location.hash) {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: "auto", block: "start" }));
}

document.querySelectorAll("[data-image-frame]").forEach((frame) => {
  const img = frame.querySelector("img");
  const reveal = () => {
    frame.classList.add("is-loaded");
    const card = frame.closest(".project-card, .render-item");
    if (card && img.naturalHeight) card.style.setProperty("--preview-aspect", String(img.naturalWidth / img.naturalHeight));
  };
  img.addEventListener("load", reveal);
  img.addEventListener("error", () => frame.classList.remove("is-loaded"));
  if (img.complete && img.naturalWidth > 0) reveal();
});

const menuButton = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  siteNav.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
});
siteNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  menuButton.setAttribute("aria-expanded", "false");
  siteNav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}));

document.querySelectorAll("[data-carousel]").forEach((section) => {
  const carousel = section.querySelector("[data-carousel-track]");
  const cards = [...carousel.children];
  if (!cards.length) { section.querySelector(".projects__controls")?.remove(); return; }
  const previous = section.querySelector("[data-carousel-prev]");
  const next = section.querySelector("[data-carousel-next]");
  const counter = section.querySelector("[data-carousel-counter]");
  let active = 0;
  const update = () => {
    previous.disabled = active === 0;
    next.disabled = active === cards.length - 1;
    counter.textContent = `${String(active + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
  };
  const goTo = (index) => {
    active = Math.max(0, Math.min(cards.length - 1, index));
    carousel.scrollTo({ left: cards[active].offsetLeft - cards[0].offsetLeft, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    update();
  };
  previous.addEventListener("click", () => goTo(active - 1));
  next.addEventListener("click", () => goTo(active + 1));
  carousel.addEventListener("scroll", () => {
    const closest = cards.reduce((best, card, index) => Math.abs(card.offsetLeft - cards[0].offsetLeft - carousel.scrollLeft) < Math.abs(cards[best].offsetLeft - cards[0].offsetLeft - carousel.scrollLeft) ? index : best, 0);
    if (closest !== active) { active = closest; update(); }
  }, { passive: true });
  update();
});

const form = document.querySelector("#contact-form");
if (form) form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const subject = `Contato pelo portfólio — ${values.get("name")}`;
  const body = `Nome: ${values.get("name")}\nE-mail: ${values.get("email")}\n\n${values.get("message")}`;
  document.querySelector("#form-note").textContent = "Seu aplicativo de e-mail será aberto. Confirme o envio por lá.";
  window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
