import Script from "next/script";
import { adminConfigured, isAdmin } from "../../lib/admin-auth";
export const dynamic = "force-dynamic";
export default async function ManagePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  if (!await isAdmin()) return <><link rel="stylesheet" href="/assets/admin.css?v=30" /><main className="manager manager--login"><header className="manager__header"><a href="/">← Voltar ao portfólio</a><span>GABRIELA MORAES / GERENCIAR</span></header><section className="manager__login"><p className="eyebrow">ÁREA DA PROPRIETÁRIA</p><h1>Acesso aos <em>projetos.</em></h1>{adminConfigured() ? <><p>Entre com sua senha para editar as informações e imagens do portfólio.</p><form action="/api/admin/login" method="post" className="manager__fields"><label>Senha<input type="password" name="password" autoComplete="current-password" required maxLength={1024} /></label>{params.error && <p role="alert">Senha incorreta. Tente novamente.</p>}<button className="manager__login-button" type="submit">Entrar no painel ↗</button></form></> : <p>O acesso ao painel ainda está sendo configurado na hospedagem.</p>}</section></main></>;
  return <><link rel="stylesheet" href="/assets/admin.css?v=30" /><div id="admin-app" data-upload-mode="blob" /><Script type="module" src="/assets/admin.js?v=30" strategy="afterInteractive" /></>;
}
