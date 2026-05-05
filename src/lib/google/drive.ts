import { requestAppsScript } from '@/lib/google/apps-script'
import { buildDriveFileViewUrl, buildDriveFolderUrl, buildDriveImageApiUrl, buildDriveThumbnailUrl, extractDriveId } from '@/lib/utils/drive-url'

export type DriveImageReference = {
  fileId?: string
  originalUrl?: string
  usableUrl?: string
  folderId?: string
}

export type DriveImageGalleryReference = {
  folderId?: string
  images: DriveImageReference[]
}

export type DriveUploadInputFile = {
  fileName: string
  mimeType: string
  base64Content: string
}

export type DriveUploadedFileReference = {
  fileId: string
  fileName: string
  originalUrl: string
  usableUrl: string
}

export type DriveUploadResult = {
  folderId: string
  folderUrl: string
  files: DriveUploadedFileReference[]
}

export type DriveImageData = {
  fileId: string
  fileName?: string
  mimeType: string
  base64Content: string
}

export type DriveRequestFolderImageReference = {
  requestId: string
  folderId?: string
  folderUrl?: string
  image?: DriveImageReference
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
    return buildDriveImageApiUrl(id, 'folder')
  }

  return buildDriveImageApiUrl(id, 'file')
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

export async function resolveReferenceImageGallery(
  linkOrId?: string | null,
  options: { limit?: number } = {},
): Promise<DriveImageGalleryReference> {
  const resolvedId = extractDriveId(linkOrId)

  if (!resolvedId) {
    return { images: [] }
  }

  const limit = Math.max(1, Math.min(options.limit ?? 3, 6))

  if (!(linkOrId ?? '').includes('/folders/')) {
    return {
      folderId: undefined,
      images: [
        {
          fileId: resolvedId,
          originalUrl: buildDriveFileViewUrl(resolvedId),
          usableUrl: buildDriveThumbnailUrl(resolvedId),
        },
      ],
    }
  }

  return requestAppsScript<DriveImageGalleryReference>('resolveDriveImageGallery', {
    query: {
      linkOrId: linkOrId ?? resolvedId,
      limit: String(limit),
    },
  })
}

export async function getDriveImageData(fileId?: string | null) {
  const resolvedId = extractDriveId(fileId)

  if (!resolvedId) {
    throw new Error('Arquivo de imagem nao informado.')
  }

  return requestAppsScript<DriveImageData>('getDriveImageData', {
    query: {
      fileId: resolvedId,
    },
  })
}

export async function uploadFilesToDriveRequestFolder(input: {
  parentFolderId: string
  requestId: string
  rootFolderName?: string
  files: DriveUploadInputFile[]
}) {
  return requestAppsScript<DriveUploadResult>('uploadFilesToRequestFolder', {
    method: 'POST',
    body: {
      parentFolderId: input.parentFolderId,
      requestId: input.requestId,
      rootFolderName: input.rootFolderName,
      files: input.files,
    },
  })
}

export async function resolveDriveRequestFolderImage(input: {
  parentFolderId: string
  requestId: string
  rootFolderName?: string
}) {
  return requestAppsScript<DriveRequestFolderImageReference>('resolveRequestFolderImage', {
    query: {
      parentFolderId: input.parentFolderId,
      requestId: input.requestId,
      rootFolderName: input.rootFolderName,
    },
  })
}
