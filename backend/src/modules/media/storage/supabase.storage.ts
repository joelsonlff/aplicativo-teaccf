import { getSupabaseAdmin, isStorageConfigured } from '../../../core/supabase/client'
import { supabaseConfig } from '../../../config/app.config'
import { AppError } from '../../../core/middleware/error-handler.middleware'

const BUCKET = supabaseConfig.storageBucket

function assertStorageConfigured(): void {
  if (!isStorageConfigured()) {
    throw new AppError(
      503,
      'STORAGE_NOT_CONFIGURED',
      'Upload de imagens indisponível no momento. O armazenamento ainda não foi configurado.',
    )
  }
}

export async function uploadToStorage(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  assertStorageConfigured()
  const supabaseAdmin = getSupabaseAdmin()

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(key, body, { contentType, upsert: true })

  if (error) throw new Error(`Upload falhou: ${error.message}`)

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key)
  return data.publicUrl
}

export async function deleteFromStorage(key: string): Promise<void> {
  assertStorageConfigured()
  await getSupabaseAdmin().storage.from(BUCKET).remove([key])
}

export function extractKeyFromUrl(url: string): string {
  const marker = `/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  return idx !== -1 ? url.slice(idx + marker.length) : url
}
