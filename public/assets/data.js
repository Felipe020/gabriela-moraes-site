export const profile = {
  name: "Gabriela Souza Moraes",
  brand: "Gabriela Moraes",
  city: "Juiz de Fora — MG",
  email: "gabrielasmoraes8@gmail.com",
  phone: "(32) 99900-1865",
  phoneHref: "+5532999001865",
  degree: "Bacharelado em Arquitetura e Urbanismo",
  institution: "Centro Universitário UniAcademia (CES)",
  educationPeriod: "2023 — atual",
  currentSemester: "8º período",
  profileImage: "/images/profile/gabriela-profile.jpg",
  instagram: "https://www.instagram.com/ggabrielamoraes/",
  linkedin: "https://www.linkedin.com/in/gabriela-moraes-a73224370/",
};

export const experiences = [
  { period: "2025 — atual", studio: "DOTS ARQUITETURA", role: "Estágio em Arquitetura e Urbanismo" },
  { period: "2024 — 2025", studio: "GATTÁS ARQUITETURA", role: "Estágio em Arquitetura e Urbanismo" },
];

export const software = ["REVIT", "SKETCHUP", "AUTOCAD", "LAYOUT", "ENSCAPE", "LUMION", "PHOTOSHOP", "ILLUSTRATOR"];

const gallery = (base, labels) => labels.map((label, index) => ({
  src: `${base}/${String(index + 1).padStart(2, "0")}.jpg`,
  label,
  fit: "cover",
  shape: "wide",
}));

export const projects = [
  {
    id: "01", slug: "edificio-residencial", title: "Domus Residence", category: "Arquitetura residencial", year: "2026", location: "Bom Pastor, Juiz de Fora — MG", discipline: "Projeto Arquitetônico IV",
    cover: "/images/projects/domus/cover.jpg",
    description: [
      "Concebido na disciplina de Projeto Arquitetônico IV, o Domus Residence ocupa um terreno vazio no bairro Bom Pastor, em Juiz de Fora. O edifício residencial foi pensado para equilibrar densidade, conforto e qualidade espacial.",
      "A proposta reúne 15 pavimentos, dos quais nove são pavimentos tipo e dois abrigam coberturas duplex. Nos pavimentos tipo, são previstas unidades de dois quartos (58,5 m²) e de três quartos (87,5 m²), definidas a partir do coeficiente de aproveitamento e da análise do bairro.",
    ],
    images: gallery("/images/projects/domus", ["Entrada principal", "Terraço", "Área externa", "Recepção", "Vista geral", "Detalhe da fachada", "Fachada frontal"]),
    diagramSoftware: "Revit",
    diagrams: [
      { src: "/images/projects/domus/plan-01.jpg", label: "Implantação e setorização", width: 2325, height: 1485 },
    ],
    plans: [
      { src: "/images/projects/domus/plan-02.jpg", label: "Planta baixa do térreo", shape: "plan-portrait", width: 1215, height: 1380 },
      { src: "/images/projects/domus/plan-03.jpg", label: "Planta baixa do PUC", shape: "plan-portrait", width: 1170, height: 1380 },
      { src: "/images/projects/domus/plan-04.jpg", label: "Planta do pavimento tipo", width: 2370, height: 1545 },
    ],
  },
  {
    id: "02", slug: "skygarden", title: "Sky Garden Corporate Tower", category: "Arquitetura corporativa", year: "2025", location: "Avenida Brasil, Juiz de Fora — MG", discipline: "Projeto Arquitetônico III",
    cover: "/images/projects/skygarden/cover.jpg",
    description: [
      "Concebido na disciplina de Projeto Arquitetônico III, o Sky Garden Corporate Tower propõe um edifício corporativo de 29 pavimentos em um terreno na Avenida Brasil, no Centro de Juiz de Fora.",
      "O térreo funciona como extensão do espaço público e estabelece uma conexão direta com a cidade. Lojas, restaurantes, áreas sombreadas e canteiros de vegetação densa convidam à permanência e ao fluxo de pedestres. O verde acompanha a torre, integrado às fachadas e aos recortes volumétricos em diferentes níveis.",
    ],
    images: gallery("/images/projects/skygarden", ["Acesso principal", "Implantação", "Interior", "Pórtico", "Fachada térrea", "Átrio", "Galeria interna", "Paisagismo"]),
    plans: [
      { src: "/images/projects/skygarden/plan-01.jpg", label: "Condicionantes e setorização", width: 2340, height: 1500 },
      { src: "/images/projects/skygarden/plan-02.jpg", label: "Implantação do térreo", width: 2385, height: 1605 },
      { src: "/images/projects/skygarden/plan-03.jpg", label: "Planta baixa do coworking", width: 2325, height: 1530 },
      { src: "/images/projects/skygarden/plan-04.jpg", label: "Plantas dos pavimentos tipo", width: 2385, height: 1605 },
    ],
  },
  {
    id: "03", slug: "escola", title: "Escola Acolher", category: "Arquitetura educacional", year: "2024", location: "Alto dos Passos, Juiz de Fora — MG", discipline: "Projeto Arquitetônico II",
    cover: "/images/projects/escola/cover.jpg",
    description: [
      "Concebida na disciplina de Projeto Arquitetônico II, a Escola Acolher propõe uma escola pública de educação infantil e ensino fundamental com metodologia montessoriana, em um terreno vazio no bairro Alto dos Passos, em Juiz de Fora.",
      "Com apenas um pavimento, o projeto busca atender à população infantil do bairro. O programa reúne auditório, biblioteca, quadras esportivas, praça externa e salas de aula.",
    ],
    images: gallery("/images/projects/escola", ["Vista aérea", "Acesso principal", "Entrada", "Praça interna", "Área esportiva", "Circulação", "Sala de aula", "Ambiente infantil", "Espaço de convivência", "Pátio", "Paisagismo", "Área de recreação"]),
    plans: [
      { src: "/images/projects/escola/plan-01.jpg", label: "Condicionantes e setorização", width: 2340, height: 1590 },
      { src: "/images/projects/escola/plan-02.jpg", label: "Implantação do térreo", width: 2385, height: 1605 },
      { src: "/images/projects/escola/plan-03.jpg", label: "Cortes 1 e 2", width: 2385, height: 1575 },
    ],
  },
];
