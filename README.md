# Portfólio de Gabriela Moraes

Site em Next.js, com projetos acadêmicos, outros projetos e painel de edição em `/gerenciar`.

## Desenvolvimento e build

Use Node.js 24 e a versão do pnpm declarada em `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm start
```

O build gera o módulo de envio direto de imagens e a aplicação Next.js. `vercel.json` contém as configurações de publicação. Os arquivos gerados, dependências, caches e segredos ficam fora do Git.

## Configuração na Vercel

- `ADMIN_PASSWORD`: senha secreta do painel, com pelo menos 12 caracteres. Configure somente nas variáveis da hospedagem; não inclua no código.
- Conecte um Vercel Blob privado ao projeto. A integração fornece `BLOB_READ_WRITE_TOKEN` ou `BLOB_STORE_ID` com OIDC.

O painel utiliza uma sessão criptografada com cookie HttpOnly. Alterações de conteúdo e uploads exigem autenticação e origem válida. O acesso público ao portfólio continua independente do login do painel.

Cada projeto editado fica em um registro próprio no Blob. O site lê esses registros a cada abertura e combina as alterações com os projetos originais de `public/assets/data.js` e `public/assets/other-projects.js`. Exclusões são registradas sem apagar as imagens existentes.

As imagens são enviadas diretamente ao armazenamento, com limite de 15 MB e formatos JPG, PNG, WebP ou AVIF. A aplicação serve as imagens pela rota `/api/media/`.

As seções de projetos acadêmicos e outros projetos compartilham o mesmo layout: capa, apresentação, ficha técnica, diagramas, desenhos técnicos e renders. O formulário de contato prepara uma mensagem no aplicativo de e-mail do visitante.
