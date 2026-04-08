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
GOOGLE_SOURCE_SHEET_ID=1A_aDf5GrnTWLdICVND1onvNDeMxWuMnur9tW9uQwZ_g
GOOGLE_OUTPUT_SHEET_ID=1QjTHwp8qnkaFOIVRHuDxXuo7si7trshjB6aSa4Pj1L0
GOOGLE_DRIVE_FOLDER_ID=1TljgB91WOfYUthu8kIIXPfSheFv-qsym
NEXT_PUBLIC_APP_NAME=Catalogo Marketplace
```

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

## Acesso as planilhas e pasta

O Apps Script roda com a sua conta, entao ele precisa ter acesso aos recursos:

- planilha principal: leitura
- planilha de saida: leitura e escrita
- pasta/arquivos do Drive: leitura

Se esses arquivos ja estao na sua conta Google ou compartilhados para voce, o Apps Script consegue acessar sem service account.

## Observacao sobre imagens

A aplicacao continua resolvendo a imagem por uma rota interna do Next, mas o URL final usa thumbnail/view do Drive. Para a miniatura aparecer no navegador com consistencia, o arquivo de imagem precisa estar acessivel pelo link do Drive.

## Endpoints

- `GET /api/catalogo?clienteCod=KRICA&termo=blusa`
  - Retorna produtos e variacoes filtrados.
- `GET /api/solicitacoes?status=nao_concluido&loja=KricaKids`
  - Lista solicitacoes gravadas na planilha de saida.
- `POST /api/solicitacoes`
  - Cria uma nova solicitacao.
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

## Migracao futura para PostgreSQL

Passos sugeridos:

1. Criar repositorios para catalogo, solicitacoes e operadores.
2. Manter os servicos atuais apontando para interfaces, nao para Apps Script diretamente.
3. Substituir a implementacao de `src/lib/google` por repositorios PostgreSQL.
4. Preservar os mesmos tipos e respostas das rotas para minimizar impacto na UI.
5. Adicionar autenticacao real e controle de autorizacao por operador/cliente.
