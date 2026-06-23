import { randomUUID } from 'crypto'
import { extname } from 'path'
import { uploadToStorage } from './storage/supabase.storage'
import { ValidationError } from '../../core/middleware/error-handler.middleware'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export interface UploadResult {
  url: string
  key: string
  content_type: string
  size_bytes: number
}

export class MediaService {
  async uploadImage(
    buffer: Buffer,
    originalName: string,
    contentType: string,
    uploaderUserId: string,
  ): Promise<UploadResult> {
    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      throw new ValidationError({
        file: ['Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.'],
      })
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new ValidationError({
        file: ['Arquivo muito grande. Tamanho máximo: 5 MB.'],
      })
    }

    const ext = extname(originalName) || this.mimeToExt(contentType)
    const key = `uploads/${uploaderUserId}/${randomUUID()}${ext}`

    const url = await uploadToStorage(key, buffer, contentType)

    return { url, key, content_type: contentType, size_bytes: buffer.length }
  }

  private mimeToExt(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    }
    return map[mime] ?? '.bin'
  }
}

export const mediaService = new MediaService()
