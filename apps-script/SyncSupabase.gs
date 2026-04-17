// ============================================================
// SYNC SUPABASE - Sincroniza planilha SISTEMA_CATALOGO_MARKETPLACE com Supabase
//
// CONFIGURAÇÃO (Script Properties):
//   SUPABASE_URL       → https://enhvtgegkzyazlsnjnwe.supabase.co
//   SUPABASE_KEY       → sua service_role key
//   SOURCE_SHEET_ID    → ID da planilha SISTEMA_CATALOGO_MARKETPLACE
//
// COMO USAR:
//   1. Abra o editor do Apps Script
//   2. Vá em Projeto > Propriedades do script e adicione as 3 propriedades acima
//   3. Execute sincronizarTudo() para sincronizar tudo de uma vez
//   4. Ou execute cada função individualmente:
//        sincronizarLojas()
//        sincronizarClientes()
//        sincronizarCatalogo()
//        sincronizarVariacoes()
// ============================================================

var BATCH_SIZE = 500

// ------------------------------------------------------------
// ENTRADA PRINCIPAL
// ------------------------------------------------------------

function sincronizarTudo() {
  var inicio = new Date()
  log_('=== INICIANDO SINCRONIZAÇÃO COMPLETA ===')

  sincronizarLojas()
  sincronizarClientes()
  sincronizarCatalogo()
  sincronizarVariacoes()

  var duracao = Math.round((new Date() - inicio) / 1000)
  log_('=== SINCRONIZAÇÃO CONCLUÍDA em ' + duracao + 's ===')
}

// ------------------------------------------------------------
// LOJAS
// ------------------------------------------------------------

function sincronizarLojas() {
  log_('--- Sincronizando LOJAS ---')
  var rows = lerAba_('DIC_CLIENTES')

  var lojas = []
  var vistas = {}

  rows.forEach(function (row) {
    var nome = compactText_(String(row['loja'] || '').trim())
    if (nome && !vistas[nome]) {
      vistas[nome] = true
      lojas.push({ nome: nome })
    }
  })

  if (lojas.length === 0) {
    log_('Nenhuma loja encontrada.')
    return
  }

  upsertSupabase_('lojas', lojas, 'nome')
  log_('Lojas sincronizadas: ' + lojas.length)
}

// ------------------------------------------------------------
// CLIENTES
// ------------------------------------------------------------

function sincronizarClientes() {
  log_('--- Sincronizando CLIENTES ---')
  var rows = lerAba_('DIC_CLIENTES')

  // Busca o mapa de nome_loja → id
  var lojaMap = buscarMapaLojas_()

  var clientes = []

  rows.forEach(function (row) {
    var fornecedorCod = compactText_(String(row['fornecedor_cod'] || '').trim().toUpperCase())
    if (!fornecedorCod) return

    var nomeLoja = compactText_(String(row['loja'] || '').trim())
    var lojaId = lojaMap[nomeLoja]
    var numForn = parseInt(row['num_forn'], 10) || null

    clientes.push({
      fornecedor_cod: fornecedorCod,
      num_forn: numForn,
      loja_id: lojaId || null,
      atualizado_em: new Date().toISOString(),
    })
  })

  if (clientes.length === 0) {
    log_('Nenhum cliente encontrado.')
    return
  }

  upsertSupabase_('clientes', clientes, 'fornecedor_cod')
  log_('Clientes sincronizados: ' + clientes.length)
}

// ------------------------------------------------------------
// CATÁLOGO DE PRODUTOS
// ------------------------------------------------------------

function sincronizarCatalogo() {
  log_('--- Sincronizando CATALOGO_PRODUTOS ---')
  var rows = lerAba_('CATALOGO_PRODUTOS')
  var registros = []

  rows.forEach(function (row) {
    var idProduto = compactText_(String(row['id_produto'] || '').trim().toUpperCase())
    if (!idProduto) return

    var clienteCod = compactText_(String(row['cd_cliente'] || '').trim().toUpperCase())
    var prefixo = clienteCod || idProduto.split('.')[0]
    var cores = splitLista_(row['Cores'] || row['cores'] || '')
    var tamanhos = splitLista_(row['Tamanhos'] || row['tamanhos'] || '')
    var midia = extrairHyperlink_(row['midia'] || row['midia__hyperlink'] || '')
    var custo = parseFloat(String(row['Custo'] || row['custo'] || '').replace(',', '.')) || null
    var ativo = true

    registros.push({
      sku_base: idProduto,
      prefixo_sku: prefixo,
      cliente_cod: clienteCod || null,
      num_prod: compactText_(String(row['num_prod'] || '').trim()) || null,
      titulo: compactText_(String(row['Titulo'] || row['titulo'] || '').trim()) || idProduto,
      cores: cores,
      tamanhos: tamanhos,
      material: compactText_(String(row['material'] || '').trim()) || null,
      midia_link: midia || null,
      custo: custo,
      ativo: ativo,
      status: 'ativo',
      origem_registro: 'sheets_sync',
      atualizado_em: new Date().toISOString(),
    })
  })

  if (registros.length === 0) {
    log_('Nenhum produto encontrado.')
    return
  }

  upsertSupabase_('catalogo_produtos', registros, 'sku_base')
  log_('Produtos sincronizados: ' + registros.length)
}

// ------------------------------------------------------------
// VARIAÇÕES DE SKU
// ------------------------------------------------------------

function sincronizarVariacoes() {
  log_('--- Sincronizando VARIACOES_SKU ---')
  var rows = lerAba_('VARIACOES_SKU')
  var registros = []

  rows.forEach(function (row) {
    var sku = compactText_(String(row['sku'] || '').trim().toUpperCase())
    if (!sku) return

    var partes = sku.split('.')
    var skuBase = partes.length >= 2 ? partes[0] + '.' + partes[1] : partes[0]
    var prefixo = partes[0]
    var clienteCod = compactText_(String(row['Cliente'] || row['cliente'] || '').trim().toUpperCase()) || prefixo
    var midia = extrairHyperlink_(row['midia'] || row['midia__hyperlink'] || '')
    var custo = parseFloat(String(row['Custo'] || row['custo'] || '').replace(',', '.')) || null
    var ativoRaw = String(row['ativo'] || '').trim().toUpperCase()
    var ativo = ativoRaw === 'SIM' || ativoRaw === 'TRUE' || ativoRaw === '1' || ativoRaw === ''

    registros.push({
      sku: sku,
      sku_base: skuBase,
      prefixo_sku: prefixo,
      cliente_cod: clienteCod || null,
      num_prod: compactText_(String(row['num_prod'] || '').trim()) || null,
      titulo: compactText_(String(row['Título'] || row['titulo'] || '').trim()) || null,
      cor: compactText_(String(row['Variação'] || row['variacao'] || '').trim()) || null,
      variacao: compactText_(String(row['Variação'] || row['variacao'] || '').trim()) || null,
      tamanho: compactText_(String(row['Tamanho'] || row['tamanho'] || '').trim()) || null,
      estampa: compactText_(String(row['Estampa'] || row['estampa'] || '').trim()) || null,
      midia_link: midia || null,
      custo: custo,
      ativo: ativo,
      status: ativo ? 'ativo' : 'inativo',
      origem_registro: compactText_(String(row['origem_registro'] || 'sheets_sync').trim()),
      versao_sku: compactText_(String(row['versao_sku'] || '').trim()) || null,
      chave_variacao: compactText_(String(row['chave_variacao'] || '').trim()) || null,
      sku_legado: compactText_(String(row['sku_legado'] || '').trim()) || null,
      atualizado_em: new Date().toISOString(),
    })
  })

  if (registros.length === 0) {
    log_('Nenhuma variação encontrada.')
    return
  }

  // Deduplica por SKU — mantém o último registro de cada chave
  var vistos = {}
  var deduplicados = []
  for (var i = registros.length - 1; i >= 0; i--) {
    var chave = registros[i].sku
    if (chave && !vistos[chave]) {
      vistos[chave] = true
      deduplicados.unshift(registros[i])
    }
  }

  var duplicatas = registros.length - deduplicados.length
  if (duplicatas > 0) {
    log_('  Duplicatas removidas: ' + duplicatas)
  }

  upsertSupabase_('variacoes_sku', deduplicados, 'sku')
  log_('Variações sincronizadas: ' + deduplicados.length)
}

// ------------------------------------------------------------
// SUPABASE REST API
// ------------------------------------------------------------

function upsertSupabase_(tabela, registros, chave) {
  var props = PropertiesService.getScriptProperties().getProperties()
  var url = (props['SUPABASE_URL'] || '').replace(/\/$/, '') + '/rest/v1/' + tabela
  var key = props['SUPABASE_KEY'] || ''

  if (!url || !key) {
    throw new Error('SUPABASE_URL e SUPABASE_KEY devem estar configurados nas Script Properties.')
  }

  var total = 0

  for (var i = 0; i < registros.length; i += BATCH_SIZE) {
    var lote = registros.slice(i, i + BATCH_SIZE)

    var response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
        'apikey': key,
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      payload: JSON.stringify(lote),
      muteHttpExceptions: true,
    })

    var code = response.getResponseCode()
    if (code !== 200 && code !== 201 && code !== 204) {
      throw new Error(
        'Erro ao fazer upsert em ' + tabela + ' (lote ' + Math.floor(i / BATCH_SIZE + 1) + '): ' +
        'HTTP ' + code + ' - ' + response.getContentText().substring(0, 300)
      )
    }

    total += lote.length
    log_('  ' + tabela + ': ' + total + '/' + registros.length + ' registros enviados')
  }
}

function buscarMapaLojas_() {
  var props = PropertiesService.getScriptProperties().getProperties()
  var url = (props['SUPABASE_URL'] || '').replace(/\/$/, '') + '/rest/v1/lojas?select=id,nome'
  var key = props['SUPABASE_KEY'] || ''

  var response = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + key,
      'apikey': key,
    },
    muteHttpExceptions: true,
  })

  var lojas = JSON.parse(response.getContentText()) || []
  var mapa = {}

  lojas.forEach(function (loja) {
    if (loja.nome) {
      mapa[loja.nome] = loja.id
    }
  })

  return mapa
}

// ------------------------------------------------------------
// LEITURA DA PLANILHA
// ------------------------------------------------------------

function lerAba_(nomeAba) {
  var props = PropertiesService.getScriptProperties().getProperties()
  var sheetId = props['SOURCE_SHEET_ID'] || ''

  if (!sheetId) {
    throw new Error('SOURCE_SHEET_ID nao configurado nas Script Properties.')
  }

  var spreadsheet = SpreadsheetApp.openById(sheetId)
  var sheet = spreadsheet.getSheetByName(nomeAba)

  if (!sheet) {
    throw new Error('Aba nao encontrada: ' + nomeAba)
  }

  return sheetToObjects_(sheet)
}

// ------------------------------------------------------------
// LEITURA DE PLANILHA (sheetToObjects_ local, sem dependência do Code.gs)
// ------------------------------------------------------------

function sheetToObjects_(sheet) {
  var range = sheet.getDataRange()
  var displayValues = range.getDisplayValues()
  var formulas = range.getFormulas()
  var richTextValues = range.getRichTextValues()

  if (!displayValues.length) return []

  var headers = displayValues[0].map(function (value, index) {
    var trimmed = String(value || '').trim()
    return trimmed || 'coluna_' + (index + 1)
  })

  var rows = []

  for (var rowIndex = 1; rowIndex < displayValues.length; rowIndex++) {
    var record = {}
    var hasValue = false

    for (var colIndex = 0; colIndex < headers.length; colIndex++) {
      var header = headers[colIndex]
      var cellValue = displayValues[rowIndex][colIndex]
      var hyperlink = extractHyperlinkFromCell_(formulas[rowIndex][colIndex], richTextValues[rowIndex][colIndex])

      if (cellValue) {
        record[header] = cellValue
        hasValue = true
      }

      if (hyperlink) {
        record[header + '__hyperlink'] = hyperlink
        hasValue = true
      }
    }

    if (hasValue) rows.push(record)
  }

  return rows
}

function extractHyperlinkFromCell_(formula, richTextValue) {
  if (richTextValue) {
    var richLink = richTextValue.getLinkUrl()
    if (richLink) return richLink
  }

  if (!formula) return ''

  var match = String(formula).match(/=HYPERLINK\("([^"]+)"[;,]/i)
  return match && match[1] ? match[1] : ''
}

// ------------------------------------------------------------
// UTILITÁRIOS
// ------------------------------------------------------------

function splitLista_(valor) {
  if (!valor) return []
  return String(valor).split(/[,;|]/).map(function (item) {
    return compactText_(item.trim())
  }).filter(Boolean)
}

function compactText_(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function extrairHyperlink_(valor) {
  if (!valor) return ''
  var text = String(valor).trim()
  // Se já é uma URL válida
  if (text.indexOf('http') === 0) return text
  // Tenta extrair de fórmula HYPERLINK
  var match = text.match(/=HYPERLINK\("([^"]+)"/i)
  if (match && match[1]) return match[1]
  return ''
}

function log_(msg) {
  Logger.log(msg)
  // Opcional: salvar log em aba da planilha
  try {
    var props = PropertiesService.getScriptProperties().getProperties()
    var sheetId = props['SOURCE_SHEET_ID'] || ''
    if (!sheetId) return

    var spreadsheet = SpreadsheetApp.openById(sheetId)
    var logSheet = spreadsheet.getSheetByName('LOG_SYNC')

    if (!logSheet) {
      logSheet = spreadsheet.insertSheet('LOG_SYNC')
      logSheet.appendRow(['timestamp', 'mensagem'])
    }

    logSheet.appendRow([new Date().toISOString(), msg])
  } catch (e) {
    // silencioso — log na planilha é opcional
  }
}
