import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import { AuthService } from '../src/modules/auth/auth.service'
import type { AuthRepository, UserRow, ChildRow } from '../src/modules/auth/auth.repository'
import { UnauthorizedError, NotFoundError } from '../src/core/middleware/error-handler.middleware'

// Custo baixo de bcrypt apenas para velocidade dos testes
const PASSWORD = 'senha-super-segura'
const PIN = '1234'

function makeUser(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 'user-1',
    email: 'prof@escola.com',
    password_hash: bcrypt.hashSync(PASSWORD, 4),
    full_name: 'Professora Ana',
    role: 'TEACHER',
    school_id: 'school-1',
    is_active: true,
    ...overrides,
  }
}

function makeChild(overrides: Partial<ChildRow> = {}): ChildRow {
  return {
    id: 'child-1',
    full_name: 'João',
    pin_hash: bcrypt.hashSync(PIN, 4),
    is_active: true,
    ...overrides,
  }
}

function makeRepo(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    findChildById: vi.fn().mockResolvedValue(null),
    updateLastLogin: vi.fn().mockResolvedValue(undefined),
    storeRefreshToken: vi.fn().mockResolvedValue(undefined),
    findRefreshTokenByHash: vi.fn().mockResolvedValue(null),
    revokeRefreshToken: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as AuthRepository
}

describe('AuthService.validateUserCredentials', () => {
  it('rejeita email inexistente', async () => {
    const service = new AuthService(makeRepo())
    await expect(service.validateUserCredentials('x@x.com', PASSWORD))
      .rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('rejeita usuário inativo', async () => {
    const repo = makeRepo({ findByEmail: vi.fn().mockResolvedValue(makeUser({ is_active: false })) })
    const service = new AuthService(repo)
    await expect(service.validateUserCredentials('prof@escola.com', PASSWORD))
      .rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('rejeita senha incorreta', async () => {
    const repo = makeRepo({ findByEmail: vi.fn().mockResolvedValue(makeUser()) })
    const service = new AuthService(repo)
    await expect(service.validateUserCredentials('prof@escola.com', 'senha-errada'))
      .rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('no sucesso, nunca retorna password_hash e armazena o refresh token', async () => {
    const repo = makeRepo({ findByEmail: vi.fn().mockResolvedValue(makeUser()) })
    const service = new AuthService(repo)

    const result = await service.validateUserCredentials('prof@escola.com', PASSWORD)

    expect(result.user).not.toHaveProperty('password_hash')
    expect(result.refreshToken).toMatch(/^[0-9a-f]{64}$/)
    expect(repo.storeRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', raw_token: result.refreshToken }),
    )
  })
})

describe('AuthService.validateChildPin', () => {
  it('rejeita criança inexistente', async () => {
    const service = new AuthService(makeRepo())
    await expect(service.validateChildPin('nao-existe', PIN))
      .rejects.toBeInstanceOf(NotFoundError)
  })

  it('rejeita PIN incorreto', async () => {
    const repo = makeRepo({ findChildById: vi.fn().mockResolvedValue(makeChild()) })
    const service = new AuthService(repo)
    await expect(service.validateChildPin('child-1', '9999'))
      .rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('no sucesso, nunca retorna pin_hash', async () => {
    const repo = makeRepo({ findChildById: vi.fn().mockResolvedValue(makeChild()) })
    const service = new AuthService(repo)

    const result = await service.validateChildPin('child-1', PIN)

    expect(result.child).not.toHaveProperty('pin_hash')
    expect(result.child.id).toBe('child-1')
  })
})

describe('AuthService.validateRefreshToken (rotação)', () => {
  const validStored = {
    user_id: 'user-1',
    expires_at: new Date(Date.now() + 86_400_000),
    revoked_at: null,
  }

  let repo: AuthRepository

  beforeEach(() => {
    repo = makeRepo({
      findRefreshTokenByHash: vi.fn().mockResolvedValue(validStored),
      findById: vi.fn().mockResolvedValue(makeUser()),
    })
  })

  it('rejeita token desconhecido', async () => {
    const service = new AuthService(makeRepo())
    await expect(service.validateRefreshToken('token-invalido'))
      .rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('rejeita token revogado', async () => {
    ;(repo.findRefreshTokenByHash as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ ...validStored, revoked_at: new Date() })
    const service = new AuthService(repo)
    await expect(service.validateRefreshToken('t')).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('rejeita token expirado', async () => {
    ;(repo.findRefreshTokenByHash as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ ...validStored, expires_at: new Date(Date.now() - 1000) })
    const service = new AuthService(repo)
    await expect(service.validateRefreshToken('t')).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('rejeita usuário desativado após emissão do token', async () => {
    ;(repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(makeUser({ is_active: false }))
    const service = new AuthService(repo)
    await expect(service.validateRefreshToken('t')).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('no sucesso, revoga o token usado e emite um novo (rotação)', async () => {
    const service = new AuthService(repo)

    const result = await service.validateRefreshToken('token-antigo')

    expect(repo.revokeRefreshToken).toHaveBeenCalledWith('token-antigo')
    expect(result.refreshToken).toMatch(/^[0-9a-f]{64}$/)
    expect(repo.storeRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({ raw_token: result.refreshToken }),
    )
    expect(result.user).not.toHaveProperty('password_hash')
  })
})
