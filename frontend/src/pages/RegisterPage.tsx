import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom'
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

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    password_confirm: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const next: Record<string, string> = {}
    if (form.username.trim().length < 3) next.username = t('validation.usernameMin')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = t('validation.email')
    if (!form.first_name.trim()) next.first_name = t('validation.required')
    if (!form.last_name.trim()) next.last_name = t('validation.required')
    if (form.password.length < 8) next.password = t('validation.passwordMin')
    if (form.password !== form.password_confirm) next.password_confirm = t('validation.passwordMatch')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError(null)
    if (!validate()) return
    try {
      await register(form)
      navigate('/dashboard')
    } catch {
      setApiError('Registration failed. Username or email may already exist.')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card elevation={0} sx={{ width: '100%', maxWidth: 520 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography
            variant="h3"
            sx={{ fontFamily: '"Fraunces", Georgia, serif', color: 'primary.main', mb: 0.5 }}
          >
            {t('app.name')}
          </Typography>
          <Typography variant="h5" gutterBottom>
            {t('auth.createAccount')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('auth.registerSubtitle')}
          </Typography>

          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}

          <Box component="form" onSubmit={(e) => void handleSubmit(e)} noValidate>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('auth.firstName')}
                  value={form.first_name}
                  onChange={set('first_name')}
                  error={!!errors.first_name}
                  helperText={errors.first_name}
                  fullWidth
                  required
                />
                <TextField
                  label={t('auth.lastName')}
                  value={form.last_name}
                  onChange={set('last_name')}
                  error={!!errors.last_name}
                  helperText={errors.last_name}
                  fullWidth
                  required
                />
              </Stack>
              <TextField
                label={t('auth.username')}
                value={form.username}
                onChange={set('username')}
                error={!!errors.username}
                helperText={errors.username}
                fullWidth
                required
              />
              <TextField
                label={t('auth.email')}
                type="email"
                value={form.email}
                onChange={set('email')}
                error={!!errors.email}
                helperText={errors.email}
                fullWidth
                required
              />
              <TextField
                label={t('auth.phone')}
                value={form.phone}
                onChange={set('phone')}
                fullWidth
              />
              <TextField
                label={t('auth.password')}
                type="password"
                value={form.password}
                onChange={set('password')}
                error={!!errors.password}
                helperText={errors.password}
                fullWidth
                required
              />
              <TextField
                label={t('auth.confirmPassword')}
                type="password"
                value={form.password_confirm}
                onChange={set('password_confirm')}
                error={!!errors.password_confirm}
                helperText={errors.password_confirm}
                fullWidth
                required
              />
              <Button type="submit" variant="contained" size="large" disabled={isLoading}>
                {isLoading ? t('common.loading') : t('auth.register')}
              </Button>
            </Stack>
          </Box>

          <Typography variant="body2" sx={{ mt: 2.5, textAlign: 'center' }}>
            {t('auth.hasAccount')}{' '}
            <Link component={RouterLink} to="/login" underline="hover">
              {t('auth.login')}
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
