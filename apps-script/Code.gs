function doGet(e) {
  return buildJsonResponse_(handleRequest_('GET', e))
}

function doPost(e) {
  return buildJsonResponse_(handleRequest_('POST', e))
}

function handleRequest_(method, e) {
  try {
    var params = (e && e.parameter) || {}
    var body = method === 'POST' ? parseJsonBody_(e) : {}
    var action = params.action || body.action

    validateToken_(params.token || body.token || '')

    switch (action) {
      case 'readSheetTab':
        return ok_(readSheetTab_(params.spreadsheetId, params.sheetName))
      case 'readMultipleSheetTabs':
        return ok_(readMultipleSheetTabs_(params.spreadsheetId, splitCsv_(params.sheetNames)))
      case 'getSpreadsheetSheetTitles':
        return ok_(getSpreadsheetSheetTitles_(params.spreadsheetId))
      case 'resolveDriveImage':
        return ok_(resolveDriveImage_(params.linkOrId))
      case 'resolveDriveImageGallery':
        return ok_(resolveDriveImageGallery_(params.linkOrId, params.limit))
      case 'getDriveImageData':
        return ok_(getDriveImageData_(params.fileId))
      case 'resolveRequestFolderImage':
        return ok_(resolveRequestFolderImage_(params.parentFolderId, params.requestId, params.rootFolderName))
      case 'uploadFilesToRequestFolder':
        return ok_(uploadFilesToRequestFolder_(body.parentFolderId, body.requestId, body.files, body.rootFolderName))
      case 'appendSheetRow':
        appendSheetRow_(body.spreadsheetId, body.sheetName, body.values)
        return ok_(null)
      case 'updateSheetRow':
        updateSheetRow_(body.spreadsheetId, body.range, body.values)
        return ok_(null)
      case 'updateRowsByLookup':
        updateRowsByLookup_(body.spreadsheetId, body.sheetName, body.keyHeader, body.updates)
        return ok_(null)
      default:
        throw new Error('Acao nao suportada: ' + action)
    }
  } catch (error) {
    return {
      ok: false,
      error: error && error.message ? error.message : 'Falha interna no Apps Script',
    }
  }
}

function ok_(data) {
  return {
    ok: true,
    data: data,
  }
}

function buildJsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON)
}

function parseJsonBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {}
  }

  return JSON.parse(e.postData.contents)
}

function validateToken_(requestToken) {
  var configuredToken = PropertiesService.getScriptProperties().getProperty('APPS_SCRIPT_TOKEN')

  if (configuredToken && configuredToken !== requestToken) {
    throw new Error('Token do Apps Script invalido')
  }
}

function splitCsv_(value) {
  if (!value) {
    return []
  }

  return String(value)
    .split(',')
    .map(function (item) { return item.trim() })
    .filter(Boolean)
}

function getSpreadsheetSheetTitles_(spreadsheetId) {
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  return spreadsheet.getSheets().map(function (sheet) {
    return sheet.getName()
  })
}

function readSheetTab_(spreadsheetId, sheetName) {
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  var sheet = spreadsheet.getSheetByName(sheetName)

  if (!sheet) {
    throw new Error('Aba nao encontrada: ' + sheetName)
  }

  return sheetToObjects_(sheet)
}

function readMultipleSheetTabs_(spreadsheetId, sheetNames) {
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  var result = {}

  sheetNames.forEach(function (sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName)
    if (!sheet) {
      return
    }

    result[sheetName] = sheetToObjects_(sheet)
  })

  return result
}

function appendSheetRow_(spreadsheetId, sheetName, values) {
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  var sheet = spreadsheet.getSheetByName(sheetName)

  if (!sheet) {
    throw new Error('Aba nao encontrada para append: ' + sheetName)
  }

  sheet.appendRow(values || [])
}

function updateSheetRow_(spreadsheetId, rangeA1, values) {
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  var range = spreadsheet.getRange(rangeA1)
  range.setValues(values)
}

function updateRowsByLookup_(spreadsheetId, sheetName, keyHeader, updates) {
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  var sheet = spreadsheet.getSheetByName(sheetName)

  if (!sheet) {
    throw new Error('Aba nao encontrada para update: ' + sheetName)
  }

  if (!updates || !updates.length) {
    return
  }

  var headerValues = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
  var headerIndexByName = {}

  headerValues.forEach(function (header, index) {
    headerIndexByName[String(header || '').trim()] = index + 1
  })

  var keyColumn = headerIndexByName[String(keyHeader || '').trim()]

  if (!keyColumn) {
    throw new Error('Coluna chave nao encontrada: ' + keyHeader)
  }

  var updateMap = {}
  updates.forEach(function (item) {
    if (item && item.key) {
      updateMap[String(item.key)] = item.values || {}
    }
  })

  var keyValues = sheet.getRange(2, keyColumn, Math.max(sheet.getLastRow() - 1, 0), 1).getDisplayValues()

  for (var rowOffset = 0; rowOffset < keyValues.length; rowOffset += 1) {
    var key = String(keyValues[rowOffset][0] || '')
    var valuesToApply = updateMap[key]

    if (!valuesToApply) {
      continue
    }

    Object.keys(valuesToApply).forEach(function (headerName) {
      var columnIndex = headerIndexByName[String(headerName || '').trim()]

      if (!columnIndex) {
        throw new Error('Coluna de atualizacao nao encontrada: ' + headerName)
      }

      sheet.getRange(rowOffset + 2, columnIndex).setValue(valuesToApply[headerName])
    })
  }
}

function sheetToObjects_(sheet) {
  var range = sheet.getDataRange()
  var displayValues = range.getDisplayValues()
  var formulas = range.getFormulas()
  var richTextValues = range.getRichTextValues()

  if (!displayValues.length) {
    return []
  }

  var headers = displayValues[0].map(function (value, index) {
    return normalizeHeader_(value, index)
  })

  var rows = []

  for (var rowIndex = 1; rowIndex < displayValues.length; rowIndex += 1) {
    var record = {}
    var hasValue = false

    for (var colIndex = 0; colIndex < headers.length; colIndex += 1) {
      var header = headers[colIndex]
      var cellValue = displayValues[rowIndex][colIndex]
      var hyperlink = extractHyperlink_(formulas[rowIndex][colIndex], richTextValues[rowIndex][colIndex])

      if (cellValue) {
        record[header] = cellValue
        hasValue = true
      }

      if (hyperlink) {
        record[header + '__hyperlink'] = hyperlink
        hasValue = true
      }
    }

    if (hasValue) {
      rows.push(record)
    }
  }

  return rows
}

function normalizeHeader_(value, index) {
  var trimmed = String(value || '').trim()
  return trimmed || 'coluna_' + (index + 1)
}

function extractHyperlink_(formula, richTextValue) {
  if (richTextValue) {
    var richLink = richTextValue.getLinkUrl()
    if (richLink) {
      return richLink
    }
  }

  if (!formula) {
    return ''
  }

  var match = String(formula).match(/=HYPERLINK\("([^"]+)"[;,]/i)
  return match && match[1] ? match[1] : ''
}

function resolveDriveImage_(linkOrId) {
  var resolvedId = extractDriveId_(linkOrId)

  if (!resolvedId) {
    return {}
  }

  if (String(linkOrId || '').indexOf('/folders/') !== -1) {
    return getFirstImageFromFolder_(resolvedId)
  }

  return {
    fileId: resolvedId,
    originalUrl: buildDriveFileViewUrl_(resolvedId),
    usableUrl: buildDriveThumbnailUrl_(resolvedId),
  }
}

function resolveDriveImageGallery_(linkOrId, limitValue) {
  var resolvedId = extractDriveId_(linkOrId)

  if (!resolvedId) {
    return { images: [] }
  }

  var limit = Math.max(1, Math.min(Number(limitValue || 3), 6))

  if (String(linkOrId || '').indexOf('/folders/') !== -1) {
    return getImageGalleryFromFolder_(resolvedId, limit)
  }

  return {
    images: [
      {
        fileId: resolvedId,
        originalUrl: buildDriveFileViewUrl_(resolvedId),
        usableUrl: buildDriveThumbnailUrl_(resolvedId),
      },
    ],
  }
}

function getFirstImageFromFolder_(folderId) {
  var folder = DriveApp.getFolderById(folderId)
  var directImage = findImageInFolder_(folder)

  if (directImage) {
    return mapDriveFile_(directImage, folderId)
  }

  var nestedImage = findImageInPreferredSubfolder_(folder, ['IMG', 'IMAGENS', 'IMGS'])

  if (nestedImage) {
    return mapDriveFile_(nestedImage, folderId)
  }

  return {
    folderId: folderId,
    originalUrl: 'https://drive.google.com/drive/folders/' + folderId,
  }
}

function getImageGalleryFromFolder_(folderId, limit) {
  var folder = DriveApp.getFolderById(folderId)
  var images = collectImagesFromFolder_(folder, limit)

  if (images.length < limit) {
    var nestedImages = collectImagesFromPreferredSubfolder_(folder, ['IMG', 'IMAGENS', 'IMGS'], limit - images.length)
    images = mergeUniqueDriveFiles_(images, nestedImages, limit)
  }

  return {
    folderId: folderId,
    images: images.map(function (file) {
      return mapDriveFile_(file, folderId)
    }),
  }
}

function findImageInFolder_(folder) {
  var files = folder.getFiles()
  var fallbackImage = null

  while (files.hasNext()) {
    var file = files.next()
    if (String(file.getMimeType() || '').indexOf('image/') !== 0) {
      continue
    }

    if (!fallbackImage) {
      fallbackImage = file
    }

    if (isMainImageName_(file.getName())) {
      return file
    }
  }

  return fallbackImage
}

function findImageInPreferredSubfolder_(folder, candidateNames) {
  var folders = folder.getFolders()

  while (folders.hasNext()) {
    var childFolder = folders.next()
    var normalizedChildName = normalizeFolderName_(childFolder.getName())

    for (var index = 0; index < candidateNames.length; index += 1) {
      if (normalizedChildName === normalizeFolderName_(candidateNames[index])) {
        return findImageInFolder_(childFolder)
      }
    }
  }

  return null
}

function collectImagesFromFolder_(folder, limit) {
  var files = folder.getFiles()
  var mainImages = []
  var fallbackImages = []

  while (files.hasNext()) {
    var file = files.next()
    if (String(file.getMimeType() || '').indexOf('image/') !== 0) {
      continue
    }

    if (isMainImageName_(file.getName())) {
      mainImages.push(file)
      continue
    }

    fallbackImages.push(file)
  }

  return mergeUniqueDriveFiles_(mainImages, fallbackImages, limit)
}

function collectImagesFromPreferredSubfolder_(folder, candidateNames, limit) {
  var folders = folder.getFolders()

  while (folders.hasNext()) {
    var childFolder = folders.next()
    var normalizedChildName = normalizeFolderName_(childFolder.getName())

    for (var index = 0; index < candidateNames.length; index += 1) {
      if (normalizedChildName === normalizeFolderName_(candidateNames[index])) {
        return collectImagesFromFolder_(childFolder, limit)
      }
    }
  }

  return []
}

function mergeUniqueDriveFiles_(primaryFiles, secondaryFiles, limit) {
  var merged = []
  var seenIds = {}
  var collections = [primaryFiles || [], secondaryFiles || []]

  for (var collectionIndex = 0; collectionIndex < collections.length; collectionIndex += 1) {
    var collection = collections[collectionIndex]

    for (var fileIndex = 0; fileIndex < collection.length; fileIndex += 1) {
      var file = collection[fileIndex]
      var fileId = file.getId()

      if (seenIds[fileId]) {
        continue
      }

      seenIds[fileId] = true
      merged.push(file)

      if (merged.length >= limit) {
        return merged
      }
    }
  }

  return merged
}

function normalizeFolderName_(value) {
  return String(value || '').trim().toUpperCase()
}

function isMainImageName_(fileName) {
  var normalized = String(fileName || '').toLowerCase().trim()
  return normalized === 'imagem_principal' ||
    normalized.indexOf('imagem_principal.') === 0 ||
    normalized.indexOf('imagem principal.') === 0 ||
    normalized === 'imagem principal'
}

function mapDriveFile_(file, folderId) {
  var fileId = file.getId()
  return {
    folderId: folderId,
    fileId: fileId,
    originalUrl: buildDriveFileViewUrl_(fileId),
    usableUrl: buildDriveThumbnailUrl_(fileId),
  }
}

function getDriveImageData_(fileId) {
  var resolvedId = extractDriveId_(fileId)

  if (!resolvedId) {
    throw new Error('Arquivo de imagem nao informado')
  }

  var file = DriveApp.getFileById(resolvedId)
  var mimeType = String(file.getMimeType() || '')

  if (mimeType.indexOf('image/') !== 0) {
    throw new Error('O arquivo do Drive nao e uma imagem valida')
  }

  var blob = file.getBlob()

  return {
    fileId: resolvedId,
    fileName: file.getName(),
    mimeType: mimeType,
    base64Content: Utilities.base64Encode(blob.getBytes()),
  }
}

function extractDriveId_(value) {
  if (!value) {
    return ''
  }

  var text = String(value).trim()
  var patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ]

  for (var index = 0; index < patterns.length; index += 1) {
    var match = text.match(patterns[index])
    if (match && match[1]) {
      return match[1]
    }
  }

  return text
}

function buildDriveFileViewUrl_(fileId) {
  return 'https://drive.google.com/file/d/' + fileId + '/view'
}

function buildDriveThumbnailUrl_(fileId) {
  return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200'
}

function uploadFilesToRequestFolder_(parentFolderId, requestId, files, rootFolderName) {
  var normalizedRequestId = String(requestId || '').trim()

  if (!parentFolderId) {
    throw new Error('Pasta pai nao informada para upload das solicitacoes')
  }

  if (!normalizedRequestId) {
    throw new Error('ID da solicitacao nao informado para upload')
  }

  var parentFolder = DriveApp.getFolderById(parentFolderId)
  var requestsRootFolder = getOrCreateChildFolder_(parentFolder, String(rootFolderName || 'solicitacoes_produto').trim() || 'solicitacoes_produto')
  var requestFolder = getOrCreateChildFolder_(requestsRootFolder, normalizedRequestId)
  var uploadedFiles = []
  var inputFiles = Array.isArray(files) ? files : []

  for (var index = 0; index < inputFiles.length; index += 1) {
    var item = inputFiles[index]

    if (!item || !item.base64Content) {
      continue
    }

    var safeName = buildUploadFileName_(normalizedRequestId, item.fileName, index)
    var mimeType = String(item.mimeType || 'application/octet-stream')
    var bytes = Utilities.base64Decode(String(item.base64Content))
    var blob = Utilities.newBlob(bytes, mimeType, safeName)
    var file = requestFolder.createFile(blob)

    uploadedFiles.push({
      fileId: file.getId(),
      fileName: file.getName(),
      originalUrl: buildDriveFileViewUrl_(file.getId()),
      usableUrl: buildDriveThumbnailUrl_(file.getId()),
    })
  }

  return {
    folderId: requestFolder.getId(),
    folderUrl: 'https://drive.google.com/drive/folders/' + requestFolder.getId(),
    files: uploadedFiles,
  }
}

function resolveRequestFolderImage_(parentFolderId, requestId, rootFolderName) {
  var normalizedRequestId = String(requestId || '').trim()

  if (!parentFolderId || !normalizedRequestId) {
    return {
      requestId: normalizedRequestId,
    }
  }

  var parentFolder = DriveApp.getFolderById(parentFolderId)
  var requestRootFolder = getChildFolderByName_(parentFolder, String(rootFolderName || 'solicitacoes_produto').trim() || 'solicitacoes_produto')

  if (!requestRootFolder) {
    return {
      requestId: normalizedRequestId,
    }
  }

  var requestFolder = getChildFolderByName_(requestRootFolder, normalizedRequestId)

  if (!requestFolder) {
    return {
      requestId: normalizedRequestId,
    }
  }

  return {
    requestId: normalizedRequestId,
    folderId: requestFolder.getId(),
    folderUrl: 'https://drive.google.com/drive/folders/' + requestFolder.getId(),
    image: getFirstImageFromFolder_(requestFolder.getId()),
  }
}

function getOrCreateChildFolder_(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName)

  if (folders.hasNext()) {
    return folders.next()
  }

  return parentFolder.createFolder(folderName)
}

function getChildFolderByName_(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName)
  return folders.hasNext() ? folders.next() : null
}

function buildUploadFileName_(requestId, fileName, index) {
  var rawName = String(fileName || '').trim()

  if (!rawName) {
    return requestId + '_' + (index + 1) + '.jpg'
  }

  return rawName
}
