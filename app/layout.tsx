import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gabriela Moraes — Arquitetura + Urbanismo",
  description: "Portfólio de Gabriela Moraes em Arquitetura e Urbanismo. Projetos, experiências e contato.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><head><link rel="stylesheet" href="/assets/site.css?v=39" /><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet" /></head><body>{children}</body></html>;
}
