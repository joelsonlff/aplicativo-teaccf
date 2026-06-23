import bcrypt from 'bcryptjs'
import { usersRepository, type UsersRepository, type SafeUserRow } from './users.repository'
import { NotFoundError, ConflictError, UnauthorizedError } from '../../core/middleware/error-handler.middleware'
import type { UserRole } from '../../core/guards/roles.guard'
import type { CreateUserInput, UpdateUserInput, ChangePasswordInput } from './dto/users.dto'

export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async getById(id: string): Promise<SafeUserRow> {
    const user = await this.repo.findById(id)
    if (!user) throw new NotFoundError('Usuário', id)
    return user
  }

  async list(params: {
    school_id?: string
    role?: UserRole
    is_active?: boolean
    search?: string
    page: number
    limit: number
  }) {
    return this.repo.list(params)
  }

  async create(input: CreateUserInput): Promise<SafeUserRow> {
    const exists = await this.repo.emailExists(input.email)
    if (exists) throw new ConflictError(`Email '${input.email}' já está em uso`)

    const password_hash = await bcrypt.hash(input.password, 12)
    return this.repo.create({ ...input, password_hash })
  }

  async update(id: string, input: UpdateUserInput): Promise<SafeUserRow> {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundError('Usuário', id)
    const updated = await this.repo.update(id, input)
    return updated!
  }

  async changePassword(id: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.repo.findById(id)
    if (!user) throw new NotFoundError('Usuário', id)

    const full = await this.repo.findByEmail(user.email)
    const match = await bcrypt.compare(input.current_password, full!.password_hash)
    if (!match) throw new UnauthorizedError('Senha atual incorreta')

    const newHash = await bcrypt.hash(input.new_password, 12)
    await this.repo.updatePassword(id, newHash)
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.repo.findById(id)
    if (!user) throw new NotFoundError('Usuário', id)
    await this.repo.update(id, { is_active: false })
  }
}

export const usersService = new UsersService(usersRepository)
