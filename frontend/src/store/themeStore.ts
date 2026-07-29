import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PaletteMode } from '@mui/material'

interface ThemeState {
  mode: PaletteMode
  language: string
  toggleMode: () => void
  setMode: (mode: PaletteMode) => void
  setLanguage: (lang: string) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      language: 'en',
      toggleMode: () => set({ mode: get().mode === 'light' ? 'dark' : 'light' }),
      setMode: (mode) => set({ mode }),
      setLanguage: (language) => {
        localStorage.setItem('khis_lang', language)
        set({ language })
      },
    }),
    { name: 'khis-theme' },
  ),
)
