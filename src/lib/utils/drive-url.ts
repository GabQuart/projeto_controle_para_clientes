const DRIVE_ID_PATTERNS = [
  /\/folders\/([a-zA-Z0-9_-]+)/,
  /\/file\/d\/([a-zA-Z0-9_-]+)/,
  /[?&]id=([a-zA-Z0-9_-]+)/,
]

export function extractDriveId(value?: string | null) {
  if (!value) {
    return ''
  }

  for (const pattern of DRIVE_ID_PATTERNS) {
    const match = value.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }

  return value.trim()
}

export function buildDriveFileViewUrl(fileId?: string | null) {
  const id = extractDriveId(fileId)
  return id ? `https://drive.google.com/file/d/${id}/view` : ''
}

export function buildDriveThumbnailUrl(fileId?: string | null) {
  const id = extractDriveId(fileId)
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1200` : ''
}

export function buildDriveFolderUrl(folderId?: string | null) {
  const id = extractDriveId(folderId)
  return id ? `https://drive.google.com/drive/folders/${id}` : ''
}
