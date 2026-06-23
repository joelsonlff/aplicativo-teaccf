import { supabaseAdmin } from '../../../core/supabase/client'
import { supabaseConfig } from '../../../config/app.config'

const BUCKET = supabaseConfig.storageBucket

export async function uploadToStorage(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(key, body, { contentType, upsert: true })

  if (error) throw new Error(`Upload falhou: ${error.message}`)

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key)
  return data.publicUrl
}

export async function deleteFromStorage(key: string): Promise<void> {
  await supabaseAdmin.storage.from(BUCKET).remove([key])
}

export function extractKeyFromUrl(url: string): string {
  const marker = `/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  return idx !== -1 ? url.slice(idx + marker.length) : url
}
