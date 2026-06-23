import axios from 'axios'
import type { CAASymbol } from '../data/caa-symbols'

const API_BASE = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000/api/v1'

const apiClient = axios.create({ baseURL: API_BASE, timeout: 10_000 })

export interface AACSymbolResponse {
  id: string
  child_id: string | null
  label: string
  image_url: string
  category_id: string
  sort_order: number
  created_at: string
}

function toMobileSymbol(s: AACSymbolResponse): CAASymbol {
  return {
    id: `teacher-${s.id}`,
    label: s.label,
    emoji: '🏫',
    color: 'teacher',
    categoryId: s.category_id || 'teacher',
    imageUri: s.image_url,
  }
}

export async function fetchTeacherSymbols(
  childId: string,
  token: string,
): Promise<CAASymbol[]> {
  const res = await apiClient.get<{ data: AACSymbolResponse[] }>('/aac/symbols', {
    params: { child_id: childId },
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data.data.map(toMobileSymbol)
}

export async function createAACSymbol(
  payload: {
    child_id: string | null
    label: string
    image_url: string
    category_id?: string
    sort_order?: number
  },
  token: string,
): Promise<AACSymbolResponse> {
  const res = await apiClient.post<{ data: AACSymbolResponse }>('/aac/symbols', payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data.data
}

export async function deleteAACSymbol(symbolId: string, token: string): Promise<void> {
  await apiClient.delete(`/aac/symbols/${symbolId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function uploadMedia(
  uri: string,
  fileName: string,
  mimeType: string,
  token: string,
): Promise<string> {
  const formData = new FormData()
  formData.append('file', { uri, name: fileName, type: mimeType } as unknown as Blob)

  const res = await apiClient.post<{ data: { url: string } }>('/media/upload', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data.data.url
}
