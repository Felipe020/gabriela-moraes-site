import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

const ownerEmail = "gabrielasmoraes8@gmail.com";

export default async function ManagePage() {
  const user = await getChatGPTUser();
  if (!user || user.email.toLowerCase() !== ownerEmail) {
    return <>
      <link rel="stylesheet" href="/assets/admin.css?v=29" />
      <main className="manager manager--login">
        <header className="manager__header"><a href="/">← PORTFÓLIO</a><span>GABRIELA MORAES / GERENCIAR</span></header>
        <section className="manager__login" aria-labelledby="login-title">
          <p className="eyebrow">ÁREA ADMINISTRATIVA</p>
          <h1 id="login-title">Acesso aos <em>projetos.</em></h1>
          <p>{user ? "Esta conta não tem permissão para gerenciar o portfólio." : "Entre com a conta proprietária para gerenciar o portfólio."}</p>
          <a className="manager__login-button" href={user ? chatGPTSignOutPath("/gerenciar") : chatGPTSignInPath("/gerenciar")} target="_top">
            {user ? "SAIR E TROCAR DE CONTA ↗" : "ENTRAR COM CHATGPT ↗"}
          </a>
        </section>
      </main>
    </>;
  }
  return <><link rel="stylesheet" href="/assets/admin.css?v=29" /><div id="admin-app" /><script type="module" src="/assets/admin.js?v=29" /></>;
}
