import { StrictMode, useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import { useTranslation } from 'react-i18next'
import App from './App'
import { createAppTheme } from './theme'
import { useThemeStore } from './store/themeStore'
import { useAuthStore } from './store/authStore'
import './i18n'
import './index.css'

function Root() {
  const mode = useThemeStore((s) => s.mode)
  const language = useThemeStore((s) => s.language)
  const { i18n } = useTranslation()
  const hydrate = useAuthStore((s) => s.hydrate)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const accessToken = useAuthStore((s) => s.accessToken)
  const theme = useMemo(() => createAppTheme(mode), [mode])

  useEffect(() => {
    hydrate()
    if (accessToken) void fetchMe()
  }, [hydrate, fetchMe, accessToken])

  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language)
  }, [language, i18n])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} autoHideDuration={3500}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
