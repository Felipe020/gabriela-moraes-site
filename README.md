# Portfólio de Gabriela Moraes

Protótipo estático, responsivo e navegável. Abra `dist/index.html` por um servidor local para usar os módulos JavaScript.

## Adicionar imagens

Os três projetos principais são Domus Residence, Sky Garden Corporate Tower e Escola Acolher. Suas imagens estão em `dist/images/projects/`, com `cover.jpg` para a capa, arquivos numerados para a galeria e `plan-*.jpg` para plantas, diagramas e cortes extraídos do portfólio fornecido. A foto de perfil está em `dist/images/profile/gabriela-profile.jpg`. Caminhos, títulos e descrições dos projetos principais ficam em `dist/assets/data.js`.

Para trocar, retirar ou acrescentar uma imagem na página de um projeto principal, edite o array `images` ou `plans` desse projeto em `data.js`. As plantas podem ser abertas em tamanho maior. As redes sociais também ficam configuráveis em `data.js`.

"Outros projetos" reúne sete galerias com 64 imagens das pastas fornecidas, convertidas para WebP em `dist/images/other-projects/`. A primeira imagem de cada galeria serve de capa. Títulos, ferramenta (Enscape ou IA), caminhos e dimensões ficam em `dist/assets/other-projects.js`; as páginas correspondentes estão em `dist/outros-projetos/`.

O formulário abre um rascunho no aplicativo de e-mail do visitante. Ele não depende de servidor nem anuncia um envio que não ocorreu.
