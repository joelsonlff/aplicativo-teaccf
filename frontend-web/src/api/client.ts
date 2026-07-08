import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@app/store/auth.store'

export const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// Injeta token em todas as requests
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Trata expiração de token automaticamente
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) throw new Error('Sem refresh token')

        // Resposta da API vem no envelope { data: { access_token, refresh_token } };
        // o refresh token é rotacionado a cada uso
        const { data: body } = await axios.post<{ data: { access_token: string; refresh_token?: string } }>(
          '/api/v1/auth/refresh',
          { refresh_token: refreshToken },
        )
        const newAccessToken = body.data.access_token
        useAuthStore.getState().setTokens(newAccessToken, body.data.refresh_token ?? refreshToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)
