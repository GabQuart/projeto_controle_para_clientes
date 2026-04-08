import { requestAppsScript } from '@/lib/google/apps-script'
import { buildDriveFileViewUrl, buildDriveFolderUrl, buildDriveThumbnailUrl, extractDriveId } from '@/lib/utils/drive-url'

export type DriveImageReference = {
  fileId?: string
  originalUrl?: string
  usableUrl?: string
  folderId?: string
}

export function extractGoogleDriveId(value?: string | null) {
  return extractDriveId(value)
}

export function convertGoogleDriveLinkToUsableUrl(value?: string | null) {
  const id = extractDriveId(value)

  if (!id) {
    return ''
  }

  if ((value ?? '').includes('/folders/')) {
    return `https://drive.google.com/drive/folders/${id}`
  }

  return buildDriveThumbnailUrl(id)
}

export function isGoogleDriveFolderLink(value?: string | null) {
  return (value ?? '').includes('/folders/')
}

export function buildGoogleDriveFolderLink(folderId?: string | null) {
  return buildDriveFolderUrl(folderId)
}

export async function resolveReferenceImage(linkOrId?: string | null): Promise<DriveImageReference> {
  const resolvedId = extractDriveId(linkOrId)

  if (!resolvedId) {
    return {}
  }

  if (!(linkOrId ?? '').includes('/folders/')) {
    return {
      fileId: resolvedId,
      originalUrl: buildDriveFileViewUrl(resolvedId),
      usableUrl: buildDriveThumbnailUrl(resolvedId),
    }
  }

  return requestAppsScript<DriveImageReference>('resolveDriveImage', {
    query: {
      linkOrId: linkOrId ?? resolvedId,
    },
  })
}
