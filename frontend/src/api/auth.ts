import api from './client'
import type { AuthTokens, LoginPayload, RegisterPayload, User } from '@/types'

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/auth/login/', payload)
  return data
}

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>('/auth/register/', payload)
  return data
}

export async function logout(refresh: string): Promise<void> {
  await api.post('/auth/logout/', { refresh })
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me/')
  return data
}

export async function updateProfile(payload: Partial<User>): Promise<User> {
  const { data } = await api.patch<User>('/auth/profile/', payload)
  return data
}
