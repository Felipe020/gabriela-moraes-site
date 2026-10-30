import { profile } from "./data.js";
export const defaultAbout = {
  name: profile.name,
  city: profile.city,
  subtitle: "ARQUITETURA + URBANISMO",
  description: [
  "Sou estudante do 8º período de Arquitetura e Urbanismo na UniAcademia, em Juiz de Fora. Tenho interesse em projeto executivo, detalhamento e renderização, áreas nas quais busco me aprimorar constantemente, assim como nos diferentes aspectos da arquitetura.",
  "Gosto de entender como as coisas funcionam e acredito que um bom projeto também depende da capacidade de transmitir informações de forma clara. Procuro desenvolver soluções criativas, funcionais e bem pensadas, sempre com atenção aos detalhes e à qualidade do resultado."
],
  photo: profile.profileImage,
  degree: profile.degree,
  institution: profile.institution,
  educationPeriod: profile.educationPeriod,
  currentSemester: profile.currentSemester,
  keywords: ["PROJETO EXECUTIVO", "DETALHAMENTO", "MODELAGEM 3D", "RENDERIZAÇÃO", "ARQUITETURA", "URBANISMO"],
};
