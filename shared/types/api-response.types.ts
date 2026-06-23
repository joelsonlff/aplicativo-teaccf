export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiSuccess<T> {
  data: T
  meta?: PaginationMeta
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export function isApiError(response: unknown): response is ApiError {
  return typeof response === 'object' && response !== null && 'error' in response
}
