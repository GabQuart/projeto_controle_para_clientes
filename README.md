# Catalogo Marketplace

Primeira versao funcional de um sistema web de catalogo e solicitacoes para operacao de marketplace, usando Next.js, React, TypeScript, Tailwind CSS e Google Apps Script como ponte para Google Sheets e Google Drive.

## Visao geral

O sistema le o catalogo em uma planilha Google Sheets somente leitura, organiza produtos e variacoes por cliente/loja e grava solicitacoes operacionais em uma planilha separada. O acesso aos dados Google acontece por um Web App do Apps Script, evitando a necessidade de Google Cloud e service account no Next.js.

## Stack

- Next.js com App Router
- React
- TypeScript
- Tailwind CSS
- Route Handlers do Next.js
- Google Apps Script
- Google Sheets
- Google Drive

## Estrutura

```text
/src
  /app
    /login
    /catalogo
    /historico
    /api
      /catalogo
      /solicitacoes
      /operadores
  /components
  /lib
    /google
    /services
    /utils
  /types
/apps-script
  Code.gs
```

## Como rodar localmente

1. Instale Node.js 20+.
2. Rode `npm install`.
3. Publique o Web App do Apps Script usando [apps-script/Code.gs](C:\Users\Manalink\Documents\Projeto_controle_clientes\apps-script\Code.gs).
4. Copie `.env.example` para `.env.local`.
5. Preencha `APPS_SCRIPT_WEB_APP_URL` com a URL `/exec` do Web App publicado.
6. Rode `npm run dev`.
7. Acesse `http://localhost:3000/login`.

## Configuracao do `.env.local`

```env
APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec
APPS_SCRIPT_TOKEN=
GOOGLE_SOURCE_SHEET_ID=YOUR_GOOGLE_SOURCE_SHEET_ID
GOOGLE_OUTPUT_SHEET_ID=YOUR_GOOGLE_OUTPUT_SHEET_ID
GOOGLE_DRIVE_FOLDER_ID=YOUR_GOOGLE_DRIVE_FOLDER_ID
GOOGLE_PRODUCT_REQUESTS_SHEET_ID=YOUR_GOOGLE_PRODUCT_REQUESTS_SHEET_ID
GOOGLE_PRODUCT_REQUESTS_SHEET_NAME=solicitacoes_produto
GOOGLE_PRODUCT_REQUESTS_UPLOAD_FOLDER_ID=YOUR_GOOGLE_PRODUCT_REQUESTS_UPLOAD_FOLDER_ID
GOOGLE_PRODUCT_REQUESTS_DRIVE_ROOT_NAME=solicitacoes_produto
CATALOG_CACHE_TTL_MINUTES=10
NEXT_PUBLIC_APP_NAME=Catalogo Marketplace
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

## Cache local do catalogo

- O catalogo agora e persistido em `/.cache/catalog.json` no servidor para acelerar buscas, paginacao e recargas da tela.
- O tempo de vida do cache e controlado por `CATALOG_CACHE_TTL_MINUTES`.
- Quando o cache ainda esta valido, o sistema reutiliza o JSON local e evita nova leitura completa no Apps Script.
- Para forcar atualizacao imediata do cache, use `GET /api/catalogo?refresh=true`.

## Publicando o Apps Script

1. Acesse [script.new](https://script.new).
2. Apague o conteudo padrao.
3. Cole o conteudo de [apps-script/Code.gs](C:\Users\Manalink\Documents\Projeto_controle_clientes\apps-script\Code.gs).
4. Salve o projeto.
5. Em `Configuracoes do projeto`, opcionalmente adicione a propriedade de script `APPS_SCRIPT_TOKEN` para proteger o endpoint.
6. Clique em `Implantar > Nova implantacao`.
7. Escolha `Aplicativo da Web`.
8. Execute como `Voce`.
9. Quem tem acesso: `Qualquer pessoa com o link`.
10. Copie a URL final `/exec` e coloque em `APPS_SCRIPT_WEB_APP_URL`.

Sempre que `apps-script/Code.gs` mudar, faca uma nova implantacao ou atualize a implantacao existente para que o Next.js consiga usar as novas acoes do Web App.

## Acesso as planilhas e pasta

O Apps Script roda com a sua conta, entao ele precisa ter acesso aos recursos:

- planilha principal: leitura
- planilha de saida: leitura e escrita
- pasta/arquivos do Drive: leitura

Se esses arquivos ja estao na sua conta Google ou compartilhados para voce, o Apps Script consegue acessar sem service account.

## Observacao sobre imagens

A aplicacao procura primeiro um arquivo chamado `imagem_principal` dentro da pasta do produto no Drive. Se encontrar, usa essa imagem na capa do produto; se nao encontrar, cai no primeiro arquivo de imagem da pasta.

Quando uma imagem principal e resolvida, o resultado fica salvo no cache JSON local do catalogo para evitar novas consultas ao Drive nas proximas cargas.

Para a miniatura aparecer no navegador com consistencia, o arquivo de imagem precisa estar acessivel pelo link do Drive.

## Endpoints

- `GET /api/catalogo?clienteCod=KRICA&termo=blusa`
  - Retorna produtos e variacoes filtrados.
- `GET /api/catalogo?clienteCod=KRICA&termo=blusa&refresh=true`
  - Forca recarga do catalogo na fonte e regrava o cache JSON local.
- `GET /api/solicitacoes?status=nao_concluido&loja=KricaKids`
  - Lista solicitacoes gravadas na planilha de saida.
- `POST /api/solicitacoes`
  - Cria uma nova solicitacao. Para ativacao e inativacao, a rota tambem atualiza o status no espelho do Supabase.
- `GET /api/solicitacoes-produto`
  - Retorna listas internas de tamanhos e cores, alem das lojas disponiveis para a conta autenticada.
- `POST /api/solicitacoes-produto`
  - Cria uma solicitacao de novo produto, envia as imagens para o Drive em `solicitacoes_produto/<id_da_solicitacao>` e grava a linha na planilha de solicitacoes de produto.
- `GET /api/operadores`
  - Lista operadores mockados para login inicial.
- `GET /api/catalogo/imagem/:fileId?kind=file|folder`
  - Resolve a imagem via Apps Script e redireciona para thumbnail ou placeholder.

## Decisoes de arquitetura

- A UI nao acessa Google diretamente; tudo passa por servicos e APIs internas.
- `src/lib/google` concentra adaptadores externos.
- `src/lib/services` concentra regras de negocio e orquestracao.
- `src/types` centraliza contratos compartilhados entre UI, servicos e rotas.
- O filtro por operador esta mockado, mas ja acoplado a `clienteCod` e `loja`.
- A migracao para PostgreSQL continua simples porque os servicos seguem isolados da UI.

## Limitacoes atuais

- O login ainda e mockado com operadores fixos.
- Ainda nao ha autenticacao real nem controle de sessao no servidor.
- Ainda nao existem testes automatizados.
- As imagens do Drive dependem de URLs renderizaveis no navegador; em ambientes mais fechados pode ser necessario manter placeholder ou tornar os arquivos acessiveis por link.
- O Apps Script atual foi desenhado para esta primeira versao e nao substitui um backend robusto para cenarios de alto volume.
- O cache em JSON funciona muito bem em execucao local ou servidores persistentes; em ambientes serverless/ephemeros ele pode ser recriado com mais frequencia.

## Migracao futura para PostgreSQL

Passos sugeridos:

1. Criar repositorios para catalogo, solicitacoes e operadores.
2. Manter os servicos atuais apontando para interfaces, nao para Apps Script diretamente.
3. Substituir a implementacao de `src/lib/google` por repositorios PostgreSQL.
4. Preservar os mesmos tipos e respostas das rotas para minimizar impacto na UI.
5. Adicionar autenticacao real e controle de autorizacao por operador/cliente.
