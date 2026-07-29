import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginPayload, RegisterPayload } from '@/types'
import * as authApi from '@/api/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setTokens: (access: string, refresh: string) => void
  setUser: (user: User | null) => void
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  hydrate: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setTokens: (access, refresh) => {
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true })
      },

      setUser: (user) => set({ user }),

      login: async (payload) => {
        set({ isLoading: true })
        try {
          const tokens = await authApi.login(payload)
          set({
            accessToken: tokens.access,
            refreshToken: tokens.refresh,
            isAuthenticated: true,
          })
          const user = await authApi.getMe()
          set({ user })
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (payload) => {
        set({ isLoading: true })
        try {
          await authApi.register(payload)
          await get().login({ username: payload.username, password: payload.password })
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        const refresh = get().refreshToken
        try {
          if (refresh) await authApi.logout(refresh)
        } catch {
          /* ignore logout errors */
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      fetchMe: async () => {
        if (!get().accessToken) return
        try {
          const user = await authApi.getMe()
          set({ user, isAuthenticated: true })
        } catch {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
        }
      },

      hydrate: () => {
        const { accessToken } = get()
        if (accessToken) set({ isAuthenticated: true })
      },
    }),
    {
      name: 'khis-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
