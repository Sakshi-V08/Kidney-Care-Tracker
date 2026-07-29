import {
  Box,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Button,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common/PageExtras'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { updateProfile } from '@/api/auth'
import { useSnackbar } from 'notistack'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const { enqueueSnackbar } = useSnackbar()
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [voice, setVoice] = useState(user?.voice_assistant_enabled || false)

  const save = async () => {
    try {
      const updated = await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
        preferred_language: i18n.language,
        dark_mode: mode === 'dark',
        voice_assistant_enabled: voice,
      })
      setUser(updated)
      enqueueSnackbar('Profile saved', { variant: 'success' })
    } catch {
      enqueueSnackbar('Could not save profile', { variant: 'error' })
    }
  }

  return (
    <Box>
      <PageHeader title={t('nav.settings')} subtitle="Language, appearance, and profile" />
      <Card elevation={0}>
        <CardContent>
          <Stack spacing={2} maxWidth={480}>
            <FormControl fullWidth size="small">
              <InputLabel>Language</InputLabel>
              <Select
                label="Language"
                value={i18n.language}
                onChange={(e) => {
                  const lng = e.target.value
                  void i18n.changeLanguage(lng)
                  localStorage.setItem('khis_lang', lng)
                }}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="hi">हिन्दी</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={mode === 'dark'}
                  onChange={(e) => setMode(e.target.checked ? 'dark' : 'light')}
                />
              }
              label="Dark mode"
            />
            <FormControlLabel
              control={<Switch checked={voice} onChange={(e) => setVoice(e.target.checked)} />}
              label="Voice assistant preference"
            />
            <TextField label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <TextField label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button variant="contained" onClick={() => void save()}>
              Save
            </Button>
            <Typography variant="caption" color="text.secondary">
              Signed in as {user?.username} ({user?.role})
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
