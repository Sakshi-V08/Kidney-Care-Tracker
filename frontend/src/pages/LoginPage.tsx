import { useState, type FormEvent } from 'react'
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import MedicalDisclaimer from '@/components/disclaimer/MedicalDisclaimer'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
    return <Navigate to={from || '/dashboard'} replace />
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!username.trim() || username.trim().length < 3) next.username = t('validation.usernameMin')
    if (!password || password.length < 8) next.password = t('validation.passwordMin')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError(null)
    if (!validate()) return
    try {
      await login({ username: username.trim(), password })
      navigate('/dashboard')
    } catch {
      setApiError('Invalid username or password')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
      }}
    >
      <Card elevation={0} sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography
            variant="h3"
            sx={{ fontFamily: '"Fraunces", Georgia, serif', color: 'primary.main', mb: 0.5 }}
          >
            {t('app.name')}
          </Typography>
          <Typography variant="h5" gutterBottom>
            {t('auth.welcomeBack')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('auth.loginSubtitle')}
          </Typography>

          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}

          <Box component="form" onSubmit={(e) => void handleSubmit(e)} noValidate>
            <Stack spacing={2}>
              <TextField
                label={t('auth.username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={!!errors.username}
                helperText={errors.username}
                autoComplete="username"
                fullWidth
                required
              />
              <TextField
                label={t('auth.password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
                autoComplete="current-password"
                fullWidth
                required
              />
              <Button type="submit" variant="contained" size="large" disabled={isLoading}>
                {isLoading ? t('common.loading') : t('auth.login')}
              </Button>
            </Stack>
          </Box>

          <Typography variant="body2" sx={{ mt: 2.5, textAlign: 'center' }}>
            {t('auth.noAccount')}{' '}
            <Link component={RouterLink} to="/register" underline="hover">
              {t('auth.register')}
            </Link>
          </Typography>
          <Box sx={{ mt: 3 }}>
            <MedicalDisclaimer compact />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
