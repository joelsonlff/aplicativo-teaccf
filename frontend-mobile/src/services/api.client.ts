import axios from 'axios'
import { useSessionStore } from '../store/session.store'

const API_BASE = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// Injeta o token da criança em todas as requisições quando há sessão ativa
apiClient.interceptors.request.use((config) => {
  const token = useSessionStore.getState().session?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
