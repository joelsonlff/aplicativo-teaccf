import { apiClient } from './client'
import type { AuthUser } from '@app/store/auth.store'

export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: {
    id: string
    email: string
    full_name: string
    role: string
    school_id?: string
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await apiClient.post<{ data: LoginResponse }>('/auth/login', { email, password })
  return res.data.data
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {})
}

export async function getMe(): Promise<AuthUser> {
  const res = await apiClient.get<{ data: { id: string; email: string; full_name: string; role: string; school_id?: string } }>('/users/me')
  const u = res.data.data
  return {
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    role: u.role as AuthUser['role'],
    schoolId: u.school_id,
  }
}
