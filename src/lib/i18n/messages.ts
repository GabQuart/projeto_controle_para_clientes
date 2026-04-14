export const SUPPORTED_LOCALES = ['pt-BR', 'en', 'es', 'zh-CN', 'ar'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_COOKIE_NAME = 'm3_locale'

export const DEFAULT_LOCALE: AppLocale = 'pt-BR'

export const messages = {
  "pt-BR": {
    "layout": {
      "brandName": "M3rcadeo",
      "tagline": "Operacao de marketplaces",
      "nav": {
        "login": "Login",
        "catalog": "Catalogo",
        "history": "Historico",
        "accounts": "Contas"
      },
      "language": "Idioma",
      "languageNames": {
        "pt-BR": "Português",
        "en": "English",
        "es": "Español",
        "zh-CN": "中文",
        "ar": "العربية"
      }
    },
    "common": {
      "close": "Fechar",
      "cancel": "Cancelar",
      "clear": "Limpar",
      "save": "Salvar",
      "loading": "Carregando...",
      "backToCatalog": "Voltar ao catalogo",
      "noSession": "Sessao autenticada nao encontrada."
    },
    "login": {
      "sectionLabel": "Acesso",
      "title": "Sistema de controle de produtos e abertura de chamados.",
      "subtitle": "Consulte catalogos por loja, acompanhe status de produtos e variacoes e envie solicitacoes operacionais de forma rapida.",
      "cards": {
        "catalog": {
          "title": "Catalogo",
          "description": "Visualize produtos, variacoes e status por loja."
        },
        "tickets": {
          "title": "Chamados",
          "description": "Abra ativacoes e inativacoes em poucos cliques."
        },
        "history": {
          "title": "Historico",
          "description": "Acompanhe a fila e o registro das solicitacoes abertas."
        }
      },
      "loginTab": "Login",
      "firstAccessTab": "Primeiro acesso",
      "loginTitle": "Entre com seu e-mail e senha",
      "firstAccessTitle": "Ative sua conta com uma senha",
      "loginDescription": "Se ainda nao tem senha, use a aba de primeiro acesso.",
      "firstAccessDescription": "Use o e-mail liberado para sua conta.",
      "emailLabel": "E-mail autorizado",
      "emailPlaceholder": "voce@empresa.com",
      "passwordLabel": "Senha",
      "passwordPlaceholder": "Digite sua senha",
      "confirmPasswordLabel": "Confirmar senha",
      "confirmPasswordPlaceholder": "Repita a senha",
      "loginButton": "Entrar no sistema",
      "firstAccessButton": "Criar senha e entrar",
      "processingLogin": "Entrando no sistema...",
      "processingFirstAccess": "Criando acesso...",
      "openCatalog": "Abrir catalogo",
      "openHistory": "Abrir historico"
    },
    "catalog": {
      "panelLabel": "Painel operacional",
      "title": "Catalogo {scope}",
      "adminRole": "Admin",
      "clientRole": "Cliente",
      "queue": "Fila: {count}",
      "addProduct": "Adicionar produto",
      "viewHistory": "Ver historico",
      "manageAccounts": "Gerenciar contas",
      "logout": "Sair",
      "status": "Status",
      "statusOptions": {
        "all": "Todos",
        "active": "Somente ativos",
        "inactive": "Somente inativos",
        "withInactive": "Com variacoes inativas"
      },
      "supplier": "Fornecedor",
      "allSuppliers": "Todos os fornecedores",
      "summary": "Resumo",
      "summaryProducts": "{current} de {total} produtos",
      "summaryVariants": "{count} variacoes na pagina",
      "summaryInactiveVariants": "{count} inativas",
      "loadError": "Falha ao carregar catalogo",
      "loading": "Carregando catalogo...",
      "loadingData": "Carregando dados...",
      "updatingProduct": "Atualizando produto...",
      "loggingOut": "Saindo da conta...",
      "searchPlaceholder": "Buscar por nome ou SKU",
      "accountScope": {
        "loading": "Carregando...",
        "allStores": "Todas as lojas",
        "myStore": "Minha loja"
      },
      "alerts": {
        "fillQuantity": "Preencha a quantidade antes de ativar.",
        "noInactiveToActivate": "Nao existem variacoes inativas para ativar neste produto.",
        "noActiveToDeactivate": "Nao existem variacoes ativas para inativar neste produto.",
        "selectedVariantAlreadyActive": "A variacao selecionada ja esta ativa.",
        "selectedVariantAlreadyInactive": "A variacao selecionada ja esta inativa."
      }
    },
    "history": {
      "label": "Historico",
      "title": "Solicitacoes da conta",
      "searchPlaceholder": "Buscar por nome, SKU ou detalhe",
      "searchLabel": "Busca no historico",
      "type": "Tipo",
      "status": "Status",
      "typeOptions": {
        "all": "Todos",
        "operational": "Ativar ou inativar",
        "newProduct": "Novos produtos"
      },
      "statusOptions": {
        "all": "Todos",
        "pending": "Pendente",
        "notCompleted": "Nao concluido",
        "inProgress": "Em andamento",
        "completed": "Concluido",
        "canceled": "Cancelado"
      },
      "loading": "Carregando historico...",
      "loadError": "Falha ao carregar historico"
    },
    "accounts": {
      "label": "Gestao de contas",
      "title": "Cadastro de acessos para admin e clientes",
      "currentAdmin": "Admin atual: {name}",
      "newAccess": "Novo acesso",
      "syncingBanner": "Sincronizando lojas, clientes e fornecedores a partir da base atual...",
      "emptyDirectory": "Ainda nao encontramos lojas no diretorio. Verifique se a migracao rodou e se o admin tem acesso para sincronizar a base.",
      "name": "Nome",
      "namePlaceholder": "Nome da conta",
      "email": "E-mail",
      "emailPlaceholder": "cliente@empresa.com",
      "role": "Perfil",
      "store": "Loja",
      "select": "Selecione",
      "roleOptions": {
        "client": "Cliente",
        "admin": "Admin"
      },
      "authTitle": "Criar login no Supabase",
      "authDescription": "Ao ativar, a conta interna e o usuario de autenticacao sao criados juntos.",
      "provisionAuth": "Autenticar e-mail agora",
      "temporaryPassword": "Senha temporaria",
      "temporaryPasswordPlaceholder": "Minimo 6 caracteres",
      "confirmEmail": "Confirmar e-mail automaticamente",
      "enabledSuppliers": "Fornecedores liberados",
      "linkedClients": "Clientes vinculados",
      "createAccount": "Criar conta",
      "syncingBase": "Sincronizar base",
      "syncing": "Sincronizando...",
      "saving": "Salvando...",
      "registeredAccounts": "Contas cadastradas",
      "loadingList": "Carregando lista de contas...",
      "totalAccess": "Acesso total",
      "supplierTag": "Fornecedor {prefix}",
      "clientTag": "Cliente {code}",
      "statusActive": "ativo",
      "statusInactive": "inativo",
      "loadingData": "Carregando dados...",
      "savingData": "Salvando conta...",
      "syncingDirectory": "Sincronizando diretorio..."
    },
    "productRequest": {
      "label": "Novo produto",
      "title": "Solicitacao de cadastro",
      "store": "Loja",
      "productTitle": "Titulo do produto",
      "productTitlePlaceholder": "Digite o nome do produto",
      "productCost": "Custo do produto",
      "sizes": "Tamanhos",
      "sizeTable": "Tabela de medidas",
      "sizeTableDescription": "Cada tamanho selecionado precisa ter uma medida preenchida.",
      "sizeMeasurements": "{count} medidas",
      "sizePlaceholderFirst": "Ex.: Busto 23 cm",
      "sizePlaceholderNext": "Ex.: Comprimento 21 cm",
      "sizeEmpty": "Selecione um ou mais tamanhos para montar a tabela de medidas.",
      "variationType": "Tipo de variacao",
      "colors": "Cores",
      "stamps": "Estampas",
      "assorted": "Variados",
      "selectColors": "Selecione as cores",
      "listStamps": "Liste as estampas",
      "stampsDescription": "Informe cada estampa em uma linha curta. Ex.: Floral / Azul.",
      "stampsPlaceholder": "Ex.: Floral / Azul",
      "listAssorted": "Liste os variados",
      "assortedDescription": "Adicione aqui as versoes diferentes do produto. Exemplo: Casinha de bonecas.",
      "assortedPlaceholder": "Ex.: Casinha de bonecas",
      "images": "Imagens",
      "imagesRequired": "No celular voce pode enviar imagens da galeria ou abrir a camera.",
      "imagesDesktop": "No computador envie as imagens do produto.",
      "uploadImages": "Enviar imagens",
      "openCamera": "Abrir camera",
      "removeImage": "Remover",
      "material": "Material",
      "materialPlaceholder": "Ex.: Algodao, viscose, linho...",
      "saveRequest": "Salvar solicitacao",
      "sending": "Enviando...",
      "loadingForm": "Carregando formulario...",
      "sendingRequest": "Enviando solicitacao...",
      "success": "Solicitacao registrada com sucesso.",
      "validation": {
        "title": "Informe o titulo do produto.",
        "cost": "Informe o custo do produto.",
        "sizes": "Selecione ao menos um tamanho.",
        "images": "Adicione pelo menos uma foto do produto."
      }
    },
    "actionSelector": {
      "quantityPlaceholder": "Qtd. ativar",
      "activate": "Ativar",
      "deactivate": "Inativar"
    },
    "productRow": {
      "catalogSku": "SKU catalogo: {sku}",
      "productInactive": "Produto inativo",
      "productPartial": "Produto parcialmente ativo",
      "productActive": "Produto ativo",
      "inactiveVariants": "{count} variacao(oes) inativa(s)",
      "expandImage": "Ampliar imagem de {title}",
      "zoom": "Ampliar",
      "collapseVariants": "Recolher variacoes",
      "showVariants": "Ver variacoes",
      "previewSubtitle": "{sku} | {store}"
    },
    "variants": {
      "inactive": "Inativa",
      "active": "Ativa",
      "noColor": "Sem cor",
      "noSize": "Sem tamanho",
      "noDetails": "Sem detalhamento adicional",
      "noVariants": "Nenhuma variacao cadastrada para este produto."
    },
    "actionModal": {
      "activateTitle": "Confirmar ativacao",
      "deactivateTitle": "Confirmar inativacao",
      "store": "Loja",
      "sku": "SKU",
      "user": "Usuario",
      "action": "Acao",
      "variants": "Variacoes",
      "activate": "Ativar",
      "deactivate": "Inativar",
      "quantity": "Quantidade",
      "quantityPlaceholder": "Ex.: 20",
      "variantsTitle": "Variacoes",
      "variantsDescription": "Escolha o que sera ativado.",
      "selectAll": "Selecionar todas",
      "clear": "Limpar",
      "noAdditionalDetails": "Sem detalhamento adicional",
      "selectedVariant": "Variacao selecionada: {sku}",
      "selectedVariants": "{count} variacao(oes) selecionada(s)",
      "success": "Acao enviada para a fila com sucesso.",
      "processingDeactivate": "Processando inativacao...",
      "processingActivate": "Processando ativacao...",
      "submitActivate": "Confirmar ativacao",
      "submitDeactivate": "Confirmar inativacao",
      "sending": "Enviando..."
    },
    "alerts": {
      "title": "Aviso",
      "close": "Fechar",
      "requestFailure": "Falha na solicitacao"
    },
    "statuses": {
      "pending": "Pendente",
      "notCompleted": "Nao concluido",
      "inProgress": "Em andamento",
      "completed": "Concluido",
      "canceled": "Cancelado"
    },
    "historyTable": {
      "noResults": "Nenhuma solicitacao encontrada para os filtros atuais.",
      "newProduct": "Novo produto",
      "operational": "Operacional",
      "catalogSku": "SKU catalogo: {sku}",
      "sku": "SKU: {sku}",
      "images": "{count} imagem(ns)",
      "openFolder": "Abrir pasta das imagens",
      "newProductLabel": "Novo produto"
    }
  },
  "en": {
    "layout": {
      "brandName": "M3rcadeo",
      "tagline": "Marketplace operations",
      "nav": {
        "login": "Login",
        "catalog": "Catalog",
        "history": "History",
        "accounts": "Accounts"
      },
      "language": "Language",
      "languageNames": {
        "pt-BR": "Português",
        "en": "English",
        "es": "Español",
        "zh-CN": "中文",
        "ar": "العربية"
      }
    },
    "common": {
      "close": "Close",
      "cancel": "Cancel",
      "clear": "Clear",
      "save": "Save",
      "loading": "Loading...",
      "backToCatalog": "Back to catalog",
      "noSession": "Authenticated session not found."
    },
    "login": {
      "sectionLabel": "Access",
      "title": "Product control and ticket management system.",
      "subtitle": "Browse store catalogs, track product and variant status, and send operational requests quickly.",
      "cards": {
        "catalog": {
          "title": "Catalog",
          "description": "View products, variants and status by store."
        },
        "tickets": {
          "title": "Tickets",
          "description": "Open activation and deactivation requests in just a few clicks."
        },
        "history": {
          "title": "History",
          "description": "Track the queue and record of submitted requests."
        }
      },
      "loginTab": "Login",
      "firstAccessTab": "First access",
      "loginTitle": "Sign in with your email and password",
      "firstAccessTitle": "Activate your account with a password",
      "loginDescription": "If you do not have a password yet, use the first access tab.",
      "firstAccessDescription": "Use the email already released for your account.",
      "emailLabel": "Authorized email",
      "emailPlaceholder": "you@company.com",
      "passwordLabel": "Password",
      "passwordPlaceholder": "Enter your password",
      "confirmPasswordLabel": "Confirm password",
      "confirmPasswordPlaceholder": "Repeat the password",
      "loginButton": "Sign in",
      "firstAccessButton": "Create password and sign in",
      "processingLogin": "Signing in...",
      "processingFirstAccess": "Creating access...",
      "openCatalog": "Open catalog",
      "openHistory": "Open history"
    },
    "catalog": {
      "panelLabel": "Operations panel",
      "title": "Catalog {scope}",
      "adminRole": "Admin",
      "clientRole": "Client",
      "queue": "Queue: {count}",
      "addProduct": "Add product",
      "viewHistory": "View history",
      "manageAccounts": "Manage accounts",
      "logout": "Sign out",
      "status": "Status",
      "statusOptions": {
        "all": "All",
        "active": "Active only",
        "inactive": "Inactive only",
        "withInactive": "With inactive variants"
      },
      "supplier": "Supplier",
      "allSuppliers": "All suppliers",
      "summary": "Summary",
      "summaryProducts": "{current} of {total} products",
      "summaryVariants": "{count} variants on this page",
      "summaryInactiveVariants": "{count} inactive",
      "loadError": "Failed to load catalog",
      "loading": "Loading catalog...",
      "loadingData": "Loading data...",
      "updatingProduct": "Updating product...",
      "loggingOut": "Signing out...",
      "searchPlaceholder": "Search by name or SKU",
      "accountScope": {
        "loading": "Loading...",
        "allStores": "All stores",
        "myStore": "My store"
      },
      "alerts": {
        "fillQuantity": "Fill in the quantity before activating.",
        "noInactiveToActivate": "There are no inactive variants to activate for this product.",
        "noActiveToDeactivate": "There are no active variants to deactivate for this product.",
        "selectedVariantAlreadyActive": "The selected variant is already active.",
        "selectedVariantAlreadyInactive": "The selected variant is already inactive."
      }
    },
    "history": {
      "label": "History",
      "title": "Account requests",
      "searchPlaceholder": "Search by name, SKU or detail",
      "searchLabel": "History search",
      "type": "Type",
      "status": "Status",
      "typeOptions": {
        "all": "All",
        "operational": "Activate or deactivate",
        "newProduct": "New products"
      },
      "statusOptions": {
        "all": "All",
        "pending": "Pending",
        "notCompleted": "Not completed",
        "inProgress": "In progress",
        "completed": "Completed",
        "canceled": "Canceled"
      },
      "loading": "Loading history...",
      "loadError": "Failed to load history"
    },
    "accounts": {
      "label": "Account management",
      "title": "Access management for admin and clients",
      "currentAdmin": "Current admin: {name}",
      "newAccess": "New access",
      "syncingBanner": "Syncing stores, clients and suppliers from the current data source...",
      "emptyDirectory": "No stores were found in the directory yet. Check if the migration ran and whether the admin can sync the source.",
      "name": "Name",
      "namePlaceholder": "Account name",
      "email": "Email",
      "emailPlaceholder": "client@company.com",
      "role": "Role",
      "store": "Store",
      "select": "Select",
      "roleOptions": {
        "client": "Client",
        "admin": "Admin"
      },
      "authTitle": "Create Supabase login",
      "authDescription": "When enabled, the internal account and authentication user are created together.",
      "provisionAuth": "Create login now",
      "temporaryPassword": "Temporary password",
      "temporaryPasswordPlaceholder": "At least 6 characters",
      "confirmEmail": "Confirm email automatically",
      "enabledSuppliers": "Enabled suppliers",
      "linkedClients": "Linked clients",
      "createAccount": "Create account",
      "syncingBase": "Sync data source",
      "syncing": "Syncing...",
      "saving": "Saving...",
      "registeredAccounts": "Registered accounts",
      "loadingList": "Loading account list...",
      "totalAccess": "Full access",
      "supplierTag": "Supplier {prefix}",
      "clientTag": "Client {code}",
      "statusActive": "active",
      "statusInactive": "inactive",
      "loadingData": "Loading data...",
      "savingData": "Saving account...",
      "syncingDirectory": "Syncing directory..."
    },
    "productRequest": {
      "label": "New product",
      "title": "Registration request",
      "store": "Store",
      "productTitle": "Product title",
      "productTitlePlaceholder": "Enter the product name",
      "productCost": "Product cost",
      "sizes": "Sizes",
      "sizeTable": "Size chart",
      "sizeTableDescription": "Each selected size must have at least one measurement.",
      "sizeMeasurements": "{count} measurements",
      "sizePlaceholderFirst": "Ex.: Bust 23 cm",
      "sizePlaceholderNext": "Ex.: Length 21 cm",
      "sizeEmpty": "Select one or more sizes to build the size chart.",
      "variationType": "Variation type",
      "colors": "Colors",
      "stamps": "Prints",
      "assorted": "Assorted",
      "selectColors": "Select colors",
      "listStamps": "List the prints",
      "stampsDescription": "Enter each print in a short field. Example: Floral / Blue.",
      "stampsPlaceholder": "Ex.: Floral / Blue",
      "listAssorted": "List the assorted versions",
      "assortedDescription": "Add the different versions of the product here. Example: Doll house.",
      "assortedPlaceholder": "Ex.: Doll house",
      "images": "Images",
      "imagesRequired": "On mobile you can upload images from the gallery or open the camera.",
      "imagesDesktop": "On desktop upload the product images.",
      "uploadImages": "Upload images",
      "openCamera": "Open camera",
      "removeImage": "Remove",
      "material": "Material",
      "materialPlaceholder": "Ex.: Cotton, viscose, linen...",
      "saveRequest": "Save request",
      "sending": "Sending...",
      "loadingForm": "Loading form...",
      "sendingRequest": "Sending request...",
      "success": "Request submitted successfully.",
      "validation": {
        "title": "Enter the product title.",
        "cost": "Enter the product cost.",
        "sizes": "Select at least one size.",
        "images": "Add at least one product photo."
      }
    },
    "actionSelector": {
      "quantityPlaceholder": "Qty. activate",
      "activate": "Activate",
      "deactivate": "Deactivate"
    },
    "productRow": {
      "catalogSku": "Catalog SKU: {sku}",
      "productInactive": "Inactive product",
      "productPartial": "Partially active product",
      "productActive": "Active product",
      "inactiveVariants": "{count} inactive variant(s)",
      "expandImage": "Expand image for {title}",
      "zoom": "Zoom",
      "collapseVariants": "Collapse variants",
      "showVariants": "View variants",
      "previewSubtitle": "{sku} | {store}"
    },
    "variants": {
      "inactive": "Inactive",
      "active": "Active",
      "noColor": "No color",
      "noSize": "No size",
      "noDetails": "No extra details",
      "noVariants": "No variants registered for this product."
    },
    "actionModal": {
      "activateTitle": "Confirm activation",
      "deactivateTitle": "Confirm deactivation",
      "store": "Store",
      "sku": "SKU",
      "user": "User",
      "action": "Action",
      "variants": "Variants",
      "activate": "Activate",
      "deactivate": "Deactivate",
      "quantity": "Quantity",
      "quantityPlaceholder": "Ex.: 20",
      "variantsTitle": "Variants",
      "variantsDescription": "Choose what will be activated.",
      "selectAll": "Select all",
      "clear": "Clear",
      "noAdditionalDetails": "No extra details",
      "selectedVariant": "Selected variant: {sku}",
      "selectedVariants": "{count} selected variant(s)",
      "success": "Action added to the queue successfully.",
      "processingDeactivate": "Processing deactivation...",
      "processingActivate": "Processing activation...",
      "submitActivate": "Confirm activation",
      "submitDeactivate": "Confirm deactivation",
      "sending": "Sending..."
    },
    "alerts": {
      "title": "Alert",
      "close": "Close",
      "requestFailure": "Request failed"
    },
    "statuses": {
      "pending": "Pending",
      "notCompleted": "Not completed",
      "inProgress": "In progress",
      "completed": "Completed",
      "canceled": "Canceled"
    },
    "historyTable": {
      "noResults": "No requests found for the current filters.",
      "newProduct": "New product",
      "operational": "Operational",
      "catalogSku": "Catalog SKU: {sku}",
      "sku": "SKU: {sku}",
      "images": "{count} image(s)",
      "openFolder": "Open image folder",
      "newProductLabel": "New product"
    }
  },
  "es": {
    "layout": {
      "brandName": "M3rcadeo",
      "tagline": "Gestión y operación de marketplaces",
      "nav": {
        "login": "Acceso",
        "catalog": "Catálogo",
        "history": "Historial",
        "accounts": "Cuentas"
      },
      "language": "Idioma",
      "languageNames": {
        "pt-BR": "Português",
        "en": "English",
        "es": "Español",
        "zh-CN": "中文",
        "ar": "العربية"
      }
    },
    "common": {
      "close": "Cerrar",
      "cancel": "Cancelar",
      "clear": "Limpiar",
      "save": "Guardar",
      "loading": "Cargando...",
      "backToCatalog": "Volver al catálogo",
      "noSession": "No se encontró una sesión autenticada."
    },
    "login": {
      "sectionLabel": "Acceso",
      "title": "Sistema de control de productos y apertura de solicitudes.",
      "subtitle": "Consulta catálogos por tienda, sigue el estado de productos y variaciones y envía solicitudes operativas rápidamente.",
      "cards": {
        "catalog": {
          "title": "Catálogo",
          "description": "Visualiza productos, variaciones y estados por tienda."
        },
        "tickets": {
          "title": "Solicitudes",
          "description": "Abre activaciones e inactivaciones en pocos clics."
        },
        "history": {
          "title": "Historial",
          "description": "Sigue la cola y el registro de las solicitudes abiertas."
        }
      },
      "loginTab": "Ingreso",
      "firstAccessTab": "Primer acceso",
      "loginTitle": "Entra con tu correo y contraseña",
      "firstAccessTitle": "Activa tu cuenta con una contraseña",
      "loginDescription": "Si aún no tienes contraseña, usa la pestaña de primer acceso.",
      "firstAccessDescription": "Usa el correo liberado para tu cuenta.",
      "emailLabel": "Correo autorizado",
      "emailPlaceholder": "tu@empresa.com",
      "passwordLabel": "Contraseña",
      "passwordPlaceholder": "Escribe tu contraseña",
      "confirmPasswordLabel": "Confirmar contraseña",
      "confirmPasswordPlaceholder": "Repite la contraseña",
      "loginButton": "Entrar al sistema",
      "firstAccessButton": "Crear contraseña y entrar",
      "processingLogin": "Entrando al sistema...",
      "processingFirstAccess": "Creando acceso...",
      "openCatalog": "Abrir catálogo",
      "openHistory": "Abrir historial"
    },
    "catalog": {
      "panelLabel": "Panel operativo",
      "title": "Catálogo {scope}",
      "adminRole": "Admin",
      "clientRole": "Cliente",
      "queue": "Cola: {count}",
      "addProduct": "Agregar producto",
      "viewHistory": "Ver historial",
      "manageAccounts": "Gestionar cuentas",
      "logout": "Salir",
      "status": "Estado",
      "statusOptions": {
        "all": "Todos",
        "active": "Solo activos",
        "inactive": "Solo inactivos",
        "withInactive": "Con variaciones inactivas"
      },
      "supplier": "Proveedor",
      "allSuppliers": "Todos los proveedores",
      "summary": "Resumen",
      "summaryProducts": "{current} de {total} productos",
      "summaryVariants": "{count} variaciones en la página",
      "summaryInactiveVariants": "{count} inactivas",
      "loadError": "No se pudo cargar el catálogo",
      "loading": "Cargando catálogo...",
      "loadingData": "Cargando datos...",
      "updatingProduct": "Actualizando producto...",
      "loggingOut": "Cerrando sesión...",
      "searchPlaceholder": "Buscar por nombre o SKU",
      "accountScope": {
        "loading": "Cargando...",
        "allStores": "Todas las tiendas",
        "myStore": "Mi tienda"
      },
      "alerts": {
        "fillQuantity": "Completa la cantidad antes de activar.",
        "noInactiveToActivate": "No hay variaciones inactivas para activar en este producto.",
        "noActiveToDeactivate": "No hay variaciones activas para inactivar en este producto.",
        "selectedVariantAlreadyActive": "La variación seleccionada ya está activa.",
        "selectedVariantAlreadyInactive": "La variación seleccionada ya está inactiva."
      }
    },
    "history": {
      "label": "Historial",
      "title": "Solicitudes de la cuenta",
      "searchPlaceholder": "Buscar por nombre, SKU o detalle",
      "searchLabel": "Búsqueda en historial",
      "type": "Tipo",
      "status": "Estado",
      "typeOptions": {
        "all": "Todos",
        "operational": "Activar o inactivar",
        "newProduct": "Nuevos productos"
      },
      "statusOptions": {
        "all": "Todos",
        "pending": "Pendiente",
        "notCompleted": "No concluido",
        "inProgress": "En curso",
        "completed": "Concluido",
        "canceled": "Cancelado"
      },
      "loading": "Cargando historial...",
      "loadError": "No se pudo cargar el historial"
    },
    "accounts": {
      "label": "Gestión de cuentas",
      "title": "Registro de accesos para admin y clientes",
      "currentAdmin": "Admin actual: {name}",
      "newAccess": "Nuevo acceso",
      "syncingBanner": "Sincronizando tiendas, clientes y proveedores desde la base actual...",
      "emptyDirectory": "Todavía no encontramos tiendas en el directorio. Verifica si la migración se ejecutó y si el admin puede sincronizar la base.",
      "name": "Nombre",
      "namePlaceholder": "Nombre de la cuenta",
      "email": "Correo",
      "emailPlaceholder": "cliente@empresa.com",
      "role": "Perfil",
      "store": "Tienda",
      "select": "Selecciona",
      "roleOptions": {
        "client": "Cliente",
        "admin": "Admin"
      },
      "authTitle": "Crear acceso en Supabase",
      "authDescription": "Al activar esta opción, la cuenta interna y el usuario de autenticación se crean juntos.",
      "provisionAuth": "Autenticar correo ahora",
      "temporaryPassword": "Contraseña temporal",
      "temporaryPasswordPlaceholder": "Mínimo 6 caracteres",
      "confirmEmail": "Confirmar correo automáticamente",
      "enabledSuppliers": "Proveedores liberados",
      "linkedClients": "Clientes vinculados",
      "createAccount": "Crear cuenta",
      "syncingBase": "Sincronizar base",
      "syncing": "Sincronizando...",
      "saving": "Guardando...",
      "registeredAccounts": "Cuentas registradas",
      "loadingList": "Cargando lista de cuentas...",
      "totalAccess": "Acceso total",
      "supplierTag": "Proveedor {prefix}",
      "clientTag": "Cliente {code}",
      "statusActive": "activo",
      "statusInactive": "inactivo",
      "loadingData": "Cargando datos...",
      "savingData": "Guardando cuenta...",
      "syncingDirectory": "Sincronizando directorio..."
    },
    "productRequest": {
      "label": "Nuevo producto",
      "title": "Solicitud de registro",
      "store": "Tienda",
      "productTitle": "Título del producto",
      "productTitlePlaceholder": "Escribe el nombre del producto",
      "productCost": "Costo del producto",
      "sizes": "Tamaños",
      "sizeTable": "Tabla de medidas",
      "sizeTableDescription": "Cada talla seleccionada necesita al menos una medida completa.",
      "sizeMeasurements": "{count} medidas",
      "sizePlaceholderFirst": "Ej.: Busto 23 cm",
      "sizePlaceholderNext": "Ej.: Largo 21 cm",
      "sizeEmpty": "Selecciona una o más tallas para montar la tabla de medidas.",
      "variationType": "Tipo de variación",
      "colors": "Colores",
      "stamps": "Estampas",
      "assorted": "Variados",
      "selectColors": "Selecciona los colores",
      "listStamps": "Lista las estampas",
      "stampsDescription": "Informa cada estampa en un campo corto. Ejemplo: Floral / Azul.",
      "stampsPlaceholder": "Ej.: Floral / Azul",
      "listAssorted": "Lista los variados",
      "assortedDescription": "Agrega aquí las versiones diferentes del producto. Ejemplo: Casita de muñecas.",
      "assortedPlaceholder": "Ej.: Casita de muñecas",
      "images": "Imágenes",
      "imagesRequired": "En el celular puedes enviar imágenes desde la galería o abrir la cámara.",
      "imagesDesktop": "En la computadora sube las imágenes del producto.",
      "uploadImages": "Enviar imágenes",
      "openCamera": "Abrir cámara",
      "removeImage": "Quitar",
      "material": "Material",
      "materialPlaceholder": "Ej.: Algodón, viscosa, lino...",
      "saveRequest": "Guardar solicitud",
      "sending": "Enviando...",
      "loadingForm": "Cargando formulario...",
      "sendingRequest": "Enviando solicitud...",
      "success": "Solicitud registrada con éxito.",
      "validation": {
        "title": "Informa el título del producto.",
        "cost": "Informa el costo del producto.",
        "sizes": "Selecciona al menos una talla.",
        "images": "Agrega al menos una foto del producto."
      }
    },
    "actionSelector": {
      "quantityPlaceholder": "Cant. activar",
      "activate": "Activar",
      "deactivate": "Inactivar"
    },
    "productRow": {
      "catalogSku": "SKU catálogo: {sku}",
      "productInactive": "Producto inactivo",
      "productPartial": "Producto parcialmente activo",
      "productActive": "Producto activo",
      "inactiveVariants": "{count} variación(es) inactiva(s)",
      "expandImage": "Ampliar imagen de {title}",
      "zoom": "Ampliar",
      "collapseVariants": "Ocultar variaciones",
      "showVariants": "Ver variaciones",
      "previewSubtitle": "{sku} | {store}"
    },
    "variants": {
      "inactive": "Inactiva",
      "active": "Activa",
      "noColor": "Sin color",
      "noSize": "Sin talla",
      "noDetails": "Sin detalles adicionales",
      "noVariants": "No hay variaciones registradas para este producto."
    },
    "actionModal": {
      "activateTitle": "Confirmar activación",
      "deactivateTitle": "Confirmar inactivación",
      "store": "Tienda",
      "sku": "SKU",
      "user": "Usuario",
      "action": "Acción",
      "variants": "Variaciones",
      "variantsTitle": "Variaciones",
      "activate": "Activar",
      "deactivate": "Inactivar",
      "quantity": "Cantidad",
      "quantityPlaceholder": "Cantidad para activar",
      "variantsDescription": "Selecciona las variaciones que deben procesarse en esta solicitud.",
      "selectAll": "Seleccionar todas",
      "clear": "Limpiar",
      "noAdditionalDetails": "Sin detalles adicionales",
      "selectedVariant": "Variación seleccionada: {sku}",
      "selectedVariants": "{count} variaciones seleccionadas",
      "success": "Solicitud registrada con éxito.",
      "sending": "Enviando...",
      "submitActivate": "Confirmar activación",
      "submitDeactivate": "Confirmar inactivación",
      "processingActivate": "Procesando activación...",
      "processingDeactivate": "Procesando inactivación..."
    },
    "alerts": {
      "title": "Aviso",
      "close": "Cerrar",
      "requestFailure": "No se pudo completar la solicitud"
    },
    "statuses": {
      "pending": "Pendiente",
      "notCompleted": "No concluido",
      "inProgress": "En curso",
      "completed": "Concluido",
      "canceled": "Cancelado"
    },
    "historyTable": {
      "noResults": "No se encontraron solicitudes para los filtros actuales.",
      "newProduct": "Nuevo producto",
      "newProductLabel": "Nuevo producto",
      "operational": "Operativo",
      "catalogSku": "SKU catálogo: {sku}",
      "sku": "SKU: {sku}",
      "images": "Imágenes: {count}",
      "openFolder": "Abrir carpeta"
    }
  },
  "zh-CN": {
    "layout": {
      "brandName": "M3rcadeo",
      "tagline": "市场平台运营管理",
      "nav": {
        "login": "登录",
        "catalog": "目录",
        "history": "历史记录",
        "accounts": "账户"
      },
      "language": "语言",
      "languageNames": {
        "pt-BR": "Português",
        "en": "English",
        "es": "Español",
        "zh-CN": "中文",
        "ar": "العربية"
      }
    },
    "common": {
      "close": "关闭",
      "cancel": "取消",
      "clear": "清除",
      "save": "保存",
      "loading": "加载中...",
      "backToCatalog": "返回目录",
      "noSession": "未找到已登录会话。"
    },
    "login": {
      "sectionLabel": "访问",
      "title": "产品控制与工单申请系统。",
      "subtitle": "按店铺查看目录，跟踪产品和变体状态，并快速提交运营请求。",
      "cards": {
        "catalog": {
          "title": "目录",
          "description": "按店铺查看产品、变体和状态。"
        },
        "tickets": {
          "title": "请求",
          "description": "几次点击即可提交激活或停用请求。"
        },
        "history": {
          "title": "历史记录",
          "description": "跟踪已提交请求的队列和记录。"
        }
      },
      "loginTab": "登录",
      "firstAccessTab": "首次访问",
      "loginTitle": "使用邮箱和密码登录",
      "firstAccessTitle": "设置密码并激活账户",
      "loginDescription": "如果你还没有密码，请使用首次访问标签。",
      "firstAccessDescription": "请使用已授权的账户邮箱。",
      "emailLabel": "授权邮箱",
      "emailPlaceholder": "you@company.com",
      "passwordLabel": "密码",
      "passwordPlaceholder": "输入你的密码",
      "confirmPasswordLabel": "确认密码",
      "confirmPasswordPlaceholder": "再次输入密码",
      "loginButton": "进入系统",
      "firstAccessButton": "创建密码并进入",
      "processingLogin": "正在登录...",
      "processingFirstAccess": "正在创建访问权限...",
      "openCatalog": "打开目录",
      "openHistory": "打开历史记录"
    },
    "catalog": {
      "panelLabel": "运营面板",
      "title": "目录 {scope}",
      "adminRole": "管理员",
      "clientRole": "客户",
      "queue": "队列：{count}",
      "addProduct": "添加产品",
      "viewHistory": "查看历史",
      "manageAccounts": "管理账户",
      "logout": "退出",
      "status": "状态",
      "statusOptions": {
        "all": "全部",
        "active": "仅激活",
        "inactive": "仅停用",
        "withInactive": "含停用变体"
      },
      "supplier": "供应商",
      "allSuppliers": "全部供应商",
      "summary": "概览",
      "summaryProducts": "{current}/{total} 个产品",
      "summaryVariants": "本页 {count} 个变体",
      "summaryInactiveVariants": "{count} 个已停用",
      "loadError": "无法加载目录",
      "loading": "正在加载目录...",
      "loadingData": "正在加载数据...",
      "updatingProduct": "正在更新产品...",
      "loggingOut": "正在退出账户...",
      "searchPlaceholder": "按名称或 SKU 搜索",
      "accountScope": {
        "loading": "加载中...",
        "allStores": "所有店铺",
        "myStore": "我的店铺"
      },
      "alerts": {
        "fillQuantity": "激活前请填写数量。",
        "noInactiveToActivate": "此产品没有可激活的停用变体。",
        "noActiveToDeactivate": "此产品没有可停用的激活变体。",
        "selectedVariantAlreadyActive": "所选变体已经激活。",
        "selectedVariantAlreadyInactive": "所选变体已经停用。"
      }
    },
    "history": {
      "label": "历史记录",
      "title": "账户请求记录",
      "searchPlaceholder": "按名称、SKU 或明细搜索",
      "searchLabel": "历史搜索",
      "type": "类型",
      "status": "状态",
      "typeOptions": {
        "all": "全部",
        "operational": "激活或停用",
        "newProduct": "新产品"
      },
      "statusOptions": {
        "all": "全部",
        "pending": "待处理",
        "notCompleted": "未完成",
        "inProgress": "处理中",
        "completed": "已完成",
        "canceled": "已取消"
      },
      "loading": "正在加载历史记录...",
      "loadError": "无法加载历史记录"
    },
    "accounts": {
      "label": "账户管理",
      "title": "管理员和客户访问注册",
      "currentAdmin": "当前管理员：{name}",
      "newAccess": "新访问",
      "syncingBanner": "正在从当前数据库同步店铺、客户和供应商...",
      "emptyDirectory": "目录中暂时没有找到店铺。请检查迁移是否完成，以及管理员是否有权限同步数据。",
      "name": "名称",
      "namePlaceholder": "账户名称",
      "email": "邮箱",
      "emailPlaceholder": "cliente@empresa.com",
      "role": "角色",
      "store": "店铺",
      "select": "请选择",
      "roleOptions": {
        "client": "客户",
        "admin": "管理员"
      },
      "authTitle": "在 Supabase 中创建登录",
      "authDescription": "启用后，内部账户和认证用户会一起创建。",
      "provisionAuth": "立即创建认证邮箱",
      "temporaryPassword": "临时密码",
      "temporaryPasswordPlaceholder": "至少 6 个字符",
      "confirmEmail": "自动确认邮箱",
      "enabledSuppliers": "已开放供应商",
      "linkedClients": "已关联客户",
      "createAccount": "创建账户",
      "syncingBase": "同步数据库",
      "syncing": "同步中...",
      "saving": "保存中...",
      "registeredAccounts": "已注册账户",
      "loadingList": "正在加载账户列表...",
      "totalAccess": "全部访问",
      "supplierTag": "供应商 {prefix}",
      "clientTag": "客户 {code}",
      "statusActive": "激活",
      "statusInactive": "停用",
      "loadingData": "正在加载数据...",
      "savingData": "正在保存账户...",
      "syncingDirectory": "正在同步目录..."
    },
    "productRequest": {
      "label": "新产品",
      "title": "产品注册申请",
      "store": "店铺",
      "productTitle": "产品标题",
      "productTitlePlaceholder": "输入产品名称",
      "productCost": "产品成本",
      "sizes": "尺码",
      "sizeTable": "尺码表",
      "sizeTableDescription": "每个已选尺码都需要至少填写一条测量信息。",
      "sizeMeasurements": "{count} 条测量",
      "sizePlaceholderFirst": "例如：胸围 23 cm",
      "sizePlaceholderNext": "例如：衣长 21 cm",
      "sizeEmpty": "请选择一个或多个尺码来创建尺码表。",
      "variationType": "变体类型",
      "colors": "颜色",
      "stamps": "印花",
      "assorted": "多款",
      "selectColors": "选择颜色",
      "listStamps": "填写印花",
      "stampsDescription": "每个印花填写一条短描述。例如：Floral / Azul。",
      "stampsPlaceholder": "例如：Floral / Azul",
      "listAssorted": "填写多款版本",
      "assortedDescription": "在这里添加产品的不同版本。例如：Casinha de bonecas。",
      "assortedPlaceholder": "例如：Casinha de bonecas",
      "images": "图片",
      "imagesRequired": "在手机上可以从相册上传图片，也可以直接打开相机。",
      "imagesDesktop": "在电脑上请上传产品图片。",
      "uploadImages": "上传图片",
      "openCamera": "打开相机",
      "removeImage": "移除",
      "material": "材质",
      "materialPlaceholder": "例如：棉、粘胶、亚麻...",
      "saveRequest": "保存申请",
      "sending": "发送中...",
      "loadingForm": "正在加载表单...",
      "sendingRequest": "正在提交申请...",
      "success": "申请已成功登记。",
      "validation": {
        "title": "请填写产品标题。",
        "cost": "请填写产品成本。",
        "sizes": "请至少选择一个尺码。",
        "images": "请至少添加一张产品图片。"
      }
    },
    "actionSelector": {
      "quantityPlaceholder": "激活数量",
      "activate": "激活",
      "deactivate": "停用"
    },
    "productRow": {
      "catalogSku": "目录 SKU：{sku}",
      "productInactive": "产品已停用",
      "productPartial": "产品部分激活",
      "productActive": "产品已激活",
      "inactiveVariants": "{count} 个变体已停用",
      "expandImage": "放大 {title} 的图片",
      "zoom": "放大",
      "collapseVariants": "????",
      "showVariants": "????",
      "previewSubtitle": "{sku} | {store}"
    },
    "variants": {
      "inactive": "停用",
      "active": "激活",
      "noColor": "无颜色",
      "noSize": "无尺码",
      "noDetails": "没有其他明细",
      "noVariants": "此产品没有已注册的变体。"
    },
    "actionModal": {
      "activateTitle": "确认激活",
      "deactivateTitle": "确认停用",
      "store": "店铺",
      "sku": "SKU",
      "user": "用户",
      "action": "操作",
      "variants": "变体",
      "variantsTitle": "变体",
      "activate": "激活",
      "deactivate": "停用",
      "quantity": "数量",
      "quantityPlaceholder": "激活数量",
      "variantsDescription": "选择此请求中需要处理的变体。",
      "selectAll": "全选",
      "clear": "清除",
      "noAdditionalDetails": "没有其他明细",
      "selectedVariant": "已选变体：{sku}",
      "selectedVariants": "已选 {count} 个变体",
      "success": "申请已成功登记。",
      "sending": "发送中...",
      "submitActivate": "确认激活",
      "submitDeactivate": "确认停用",
      "processingActivate": "正在处理激活...",
      "processingDeactivate": "正在处理停用..."
    },
    "alerts": {
      "title": "提示",
      "close": "关闭",
      "requestFailure": "请求未能完成"
    },
    "statuses": {
      "pending": "待处理",
      "notCompleted": "未完成",
      "inProgress": "处理中",
      "completed": "已完成",
      "canceled": "已取消"
    },
    "historyTable": {
      "noResults": "当前筛选条件下没有找到请求。",
      "newProduct": "新产品",
      "newProductLabel": "新产品",
      "operational": "运营请求",
      "catalogSku": "目录 SKU：{sku}",
      "sku": "SKU：{sku}",
      "images": "图片：{count}",
      "openFolder": "打开文件夹"
    }
  },
  "ar": {
    "layout": {
      "brandName": "M3rcadeo",
      "tagline": "إدارة وتشغيل المنصات التجارية",
      "nav": {
        "login": "الدخول",
        "catalog": "الكتالوج",
        "history": "السجل",
        "accounts": "الحسابات"
      },
      "language": "اللغة",
      "languageNames": {
        "pt-BR": "Português",
        "en": "English",
        "es": "Español",
        "zh-CN": "中文",
        "ar": "العربية"
      }
    },
    "common": {
      "close": "إغلاق",
      "cancel": "إلغاء",
      "clear": "مسح",
      "save": "حفظ",
      "loading": "جارٍ التحميل...",
      "backToCatalog": "العودة إلى الكتالوج",
      "noSession": "لم يتم العثور على جلسة مصادقة."
    },
    "login": {
      "sectionLabel": "الوصول",
      "title": "نظام التحكم بالمنتجات وفتح الطلبات.",
      "subtitle": "استعرض كتالوجات المتاجر وتابع حالة المنتجات والمتغيرات وأرسل الطلبات التشغيلية بسرعة.",
      "cards": {
        "catalog": {
          "title": "الكتالوج",
          "description": "اعرض المنتجات والمتغيرات والحالات حسب المتجر."
        },
        "tickets": {
          "title": "الطلبات",
          "description": "أنشئ طلبات التفعيل والتعطيل خلال ثوانٍ."
        },
        "history": {
          "title": "السجل",
          "description": "تابع قائمة الطلبات وسجل العمليات المفتوحة."
        }
      },
      "loginTab": "تسجيل الدخول",
      "firstAccessTab": "أول دخول",
      "loginTitle": "ادخل ببريدك الإلكتروني وكلمة المرور",
      "firstAccessTitle": "فعّل حسابك بكلمة مرور",
      "loginDescription": "إذا لم يكن لديك كلمة مرور بعد، استخدم تبويب أول دخول.",
      "firstAccessDescription": "استخدم البريد الإلكتروني المصرح به لحسابك.",
      "emailLabel": "البريد المعتمد",
      "emailPlaceholder": "you@company.com",
      "passwordLabel": "كلمة المرور",
      "passwordPlaceholder": "أدخل كلمة المرور",
      "confirmPasswordLabel": "تأكيد كلمة المرور",
      "confirmPasswordPlaceholder": "أعد إدخال كلمة المرور",
      "loginButton": "الدخول إلى النظام",
      "firstAccessButton": "إنشاء كلمة المرور والدخول",
      "processingLogin": "جارٍ تسجيل الدخول...",
      "processingFirstAccess": "جارٍ إنشاء الوصول...",
      "openCatalog": "فتح الكتالوج",
      "openHistory": "فتح السجل"
    },
    "catalog": {
      "panelLabel": "لوحة التشغيل",
      "title": "كتالوج {scope}",
      "adminRole": "مسؤول",
      "clientRole": "عميل",
      "queue": "الطابور: {count}",
      "addProduct": "إضافة منتج",
      "viewHistory": "عرض السجل",
      "manageAccounts": "إدارة الحسابات",
      "logout": "تسجيل الخروج",
      "status": "الحالة",
      "statusOptions": {
        "all": "الكل",
        "active": "النشطة فقط",
        "inactive": "غير النشطة فقط",
        "withInactive": "بمتغيرات غير نشطة"
      },
      "supplier": "المورّد",
      "allSuppliers": "كل الموردين",
      "summary": "الملخص",
      "summaryProducts": "{current} من {total} منتجًا",
      "summaryVariants": "{count} متغيرًا في الصفحة",
      "summaryInactiveVariants": "{count} غير نشط",
      "loadError": "تعذر تحميل الكتالوج",
      "loading": "جارٍ تحميل الكتالوج...",
      "loadingData": "جارٍ تحميل البيانات...",
      "updatingProduct": "جارٍ تحديث المنتج...",
      "loggingOut": "جارٍ تسجيل الخروج...",
      "searchPlaceholder": "ابحث بالاسم أو SKU",
      "accountScope": {
        "loading": "جارٍ التحميل...",
        "allStores": "كل المتاجر",
        "myStore": "متجري"
      },
      "alerts": {
        "fillQuantity": "املأ الكمية قبل التفعيل.",
        "noInactiveToActivate": "لا توجد متغيرات غير نشطة لتفعيلها في هذا المنتج.",
        "noActiveToDeactivate": "لا توجد متغيرات نشطة لتعطيلها في هذا المنتج.",
        "selectedVariantAlreadyActive": "المتغير المحدد نشط بالفعل.",
        "selectedVariantAlreadyInactive": "المتغير المحدد غير نشط بالفعل."
      }
    },
    "history": {
      "label": "السجل",
      "title": "طلبات الحساب",
      "searchPlaceholder": "ابحث بالاسم أو SKU أو التفاصيل",
      "searchLabel": "البحث في السجل",
      "type": "النوع",
      "status": "الحالة",
      "typeOptions": {
        "all": "الكل",
        "operational": "تفعيل أو تعطيل",
        "newProduct": "منتجات جديدة"
      },
      "statusOptions": {
        "all": "الكل",
        "pending": "قيد الانتظار",
        "notCompleted": "غير مكتمل",
        "inProgress": "قيد التنفيذ",
        "completed": "مكتمل",
        "canceled": "ملغي"
      },
      "loading": "جارٍ تحميل السجل...",
      "loadError": "تعذر تحميل السجل"
    },
    "accounts": {
      "label": "إدارة الحسابات",
      "title": "إدارة الوصول للمسؤولين والعملاء",
      "currentAdmin": "المسؤول الحالي: {name}",
      "newAccess": "وصول جديد",
      "syncingBanner": "جارٍ مزامنة المتاجر والعملاء والموردين من المصدر الحالي...",
      "emptyDirectory": "لم نعثر على متاجر في الدليل حتى الآن. تحقق من تشغيل الترحيل ومن أن المسؤول يملك صلاحية المزامنة.",
      "name": "الاسم",
      "namePlaceholder": "اسم الحساب",
      "email": "البريد الإلكتروني",
      "emailPlaceholder": "client@company.com",
      "role": "الدور",
      "store": "المتجر",
      "select": "اختر",
      "roleOptions": {
        "client": "عميل",
        "admin": "مسؤول"
      },
      "authTitle": "إنشاء دخول عبر Supabase",
      "authDescription": "عند التفعيل يتم إنشاء الحساب الداخلي وحساب المصادقة معًا.",
      "provisionAuth": "إنشاء المصادقة الآن",
      "temporaryPassword": "كلمة مرور مؤقتة",
      "temporaryPasswordPlaceholder": "6 أحرف على الأقل",
      "confirmEmail": "تأكيد البريد تلقائيًا",
      "enabledSuppliers": "الموردون المسموحون",
      "linkedClients": "العملاء المرتبطون",
      "createAccount": "إنشاء حساب",
      "syncingBase": "مزامنة المصدر",
      "syncing": "جارٍ المزامنة...",
      "saving": "جارٍ الحفظ...",
      "registeredAccounts": "الحسابات المسجلة",
      "loadingList": "جارٍ تحميل قائمة الحسابات...",
      "totalAccess": "وصول كامل",
      "supplierTag": "المورد {prefix}",
      "clientTag": "العميل {code}",
      "statusActive": "نشط",
      "statusInactive": "غير نشط",
      "loadingData": "جارٍ تحميل البيانات...",
      "savingData": "جارٍ حفظ الحساب...",
      "syncingDirectory": "جارٍ مزامنة الدليل..."
    },
    "productRequest": {
      "label": "منتج جديد",
      "title": "طلب تسجيل منتج",
      "store": "المتجر",
      "productTitle": "عنوان المنتج",
      "productTitlePlaceholder": "أدخل اسم المنتج",
      "productCost": "تكلفة المنتج",
      "sizes": "المقاسات",
      "sizeTable": "جدول المقاسات",
      "sizeTableDescription": "كل مقاس تم اختياره يحتاج إلى قياس واحد على الأقل.",
      "sizeMeasurements": "{count} قياس",
      "sizePlaceholderFirst": "مثال: الصدر 23 سم",
      "sizePlaceholderNext": "مثال: الطول 21 سم",
      "sizeEmpty": "اختر مقاسًا واحدًا أو أكثر لإنشاء جدول المقاسات.",
      "variationType": "نوع المتغير",
      "colors": "الألوان",
      "stamps": "النقشات",
      "assorted": "متنوعات",
      "selectColors": "اختر الألوان",
      "listStamps": "أدرج النقشات",
      "stampsDescription": "أدخل كل نقشة في سطر قصير. مثال: Floral / Azul.",
      "stampsPlaceholder": "مثال: Floral / Azul",
      "listAssorted": "أدرج النسخ المتنوعة",
      "assortedDescription": "أضف هنا النسخ المختلفة من المنتج. مثال: Casinha de bonecas.",
      "assortedPlaceholder": "مثال: Casinha de bonecas",
      "images": "الصور",
      "imagesRequired": "في الجوال يمكنك رفع الصور من المعرض أو فتح الكاميرا.",
      "imagesDesktop": "على الكمبيوتر ارفع صور المنتج.",
      "uploadImages": "رفع الصور",
      "openCamera": "فتح الكاميرا",
      "removeImage": "إزالة",
      "material": "الخامة",
      "materialPlaceholder": "مثال: قطن، فيسكوز، كتان...",
      "saveRequest": "حفظ الطلب",
      "sending": "جارٍ الإرسال...",
      "loadingForm": "جارٍ تحميل النموذج...",
      "sendingRequest": "جارٍ إرسال الطلب...",
      "success": "تم تسجيل الطلب بنجاح.",
      "validation": {
        "title": "أدخل عنوان المنتج.",
        "cost": "أدخل تكلفة المنتج.",
        "sizes": "اختر مقاسًا واحدًا على الأقل.",
        "images": "أضف صورة واحدة على الأقل للمنتج."
      }
    },
    "actionSelector": {
      "quantityPlaceholder": "كمية التفعيل",
      "activate": "تفعيل",
      "deactivate": "تعطيل"
    },
    "productRow": {
      "catalogSku": "SKU الكتالوج: {sku}",
      "productInactive": "منتج غير نشط",
      "productPartial": "منتج نشط جزئيًا",
      "productActive": "منتج نشط",
      "inactiveVariants": "{count} متغير(ات) غير نشطة",
      "expandImage": "تكبير صورة {title}",
      "zoom": "تكبير",
      "collapseVariants": "إخفاء المتغيرات",
      "showVariants": "عرض المتغيرات",
      "previewSubtitle": "{sku} | {store}"
    },
    "variants": {
      "inactive": "غير نشط",
      "active": "نشط",
      "noColor": "بدون لون",
      "noSize": "بدون مقاس",
      "noDetails": "لا توجد تفاصيل إضافية",
      "noVariants": "لا توجد متغيرات مسجلة لهذا المنتج."
    },
    "actionModal": {
      "activateTitle": "تأكيد التفعيل",
      "deactivateTitle": "تأكيد التعطيل",
      "store": "المتجر",
      "sku": "SKU",
      "user": "المستخدم",
      "action": "الإجراء",
      "variants": "المتغيرات",
      "activate": "تفعيل",
      "deactivate": "تعطيل",
      "quantity": "الكمية",
      "quantityPlaceholder": "مثال: 20",
      "variantsTitle": "المتغيرات",
      "variantsDescription": "اختر المتغيرات التي سيتم التعامل معها.",
      "selectAll": "تحديد الكل",
      "clear": "مسح",
      "noAdditionalDetails": "لا توجد تفاصيل إضافية",
      "selectedVariant": "المتغير المحدد: {sku}",
      "selectedVariants": "{count} متغير(ات) محددة",
      "success": "تم إرسال الطلب إلى قائمة الانتظار بنجاح.",
      "processingDeactivate": "جارٍ تنفيذ التعطيل...",
      "processingActivate": "جارٍ تنفيذ التفعيل...",
      "submitActivate": "تأكيد التفعيل",
      "submitDeactivate": "تأكيد التعطيل",
      "sending": "جارٍ الإرسال..."
    },
    "alerts": {
      "title": "تنبيه",
      "close": "إغلاق",
      "requestFailure": "تعذر تنفيذ الطلب"
    },
    "statuses": {
      "pending": "قيد الانتظار",
      "notCompleted": "غير مكتمل",
      "inProgress": "قيد التنفيذ",
      "completed": "مكتمل",
      "canceled": "ملغي"
    },
    "historyTable": {
      "noResults": "لم يتم العثور على طلبات ضمن الفلاتر الحالية.",
      "newProduct": "منتج جديد",
      "operational": "تشغيلي",
      "catalogSku": "SKU الكتالوج: {sku}",
      "sku": "SKU: {sku}",
      "images": "{count} صورة",
      "openFolder": "فتح المجلد",
      "newProductLabel": "منتج جديد"
    }
  }
} as const

export function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function getMessages(locale: AppLocale) {
  return messages[locale] ?? messages[DEFAULT_LOCALE]
}

export function resolveMessage(locale: AppLocale, key: string) {
  const source = getMessages(locale) as Record<string, unknown>

  return key.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined
    }

    return (current as Record<string, unknown>)[segment]
  }, source)
}

export function formatMessage(template: string, values?: Record<string, string | number>) {
  if (!values) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''))
}
