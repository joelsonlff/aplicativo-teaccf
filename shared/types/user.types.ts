export type UserRole = 'TEACHER' | 'PARENT' | 'ADMIN'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  phone?: string
  avatarUrl?: string
  isActive: boolean
  emailVerified: boolean
  schoolId?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse {
  user: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'schoolId'>
  tokens: AuthTokens
}
