import { requestAppsScript } from '@/lib/google/apps-script'

export type SheetCellValue = string | undefined
export type SheetRow = Record<string, SheetCellValue>
export type SheetMap = Record<string, SheetRow[]>

export async function readSheetTab(spreadsheetId: string, sheetName: string) {
  return requestAppsScript<SheetRow[]>('readSheetTab', {
    query: {
      spreadsheetId,
      sheetName,
    },
  })
}

export async function readMultipleSheetTabs(spreadsheetId: string, sheetNames: string[]) {
  return requestAppsScript<SheetMap>('readMultipleSheetTabs', {
    query: {
      spreadsheetId,
      sheetNames: sheetNames.join(','),
    },
  })
}

export async function appendSheetRow(spreadsheetId: string, sheetName: string, values: string[]) {
  await requestAppsScript<null>('appendSheetRow', {
    method: 'POST',
    body: {
      spreadsheetId,
      sheetName,
      values,
    },
  })
}

export async function updateSheetRow(spreadsheetId: string, range: string, values: string[][]) {
  await requestAppsScript<null>('updateSheetRow', {
    method: 'POST',
    body: {
      spreadsheetId,
      range,
      values,
    },
  })
}

export async function getSpreadsheetSheetTitles(spreadsheetId: string) {
  return requestAppsScript<string[]>('getSpreadsheetSheetTitles', {
    query: {
      spreadsheetId,
    },
  })
}
