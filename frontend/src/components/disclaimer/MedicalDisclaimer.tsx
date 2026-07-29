import { Alert, Box, Typography } from '@mui/material'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { useTranslation } from 'react-i18next'
import { MEDICAL_DISCLAIMER } from '@/types'

interface Props {
  compact?: boolean
  sticky?: boolean
}

export default function MedicalDisclaimer({ compact = false, sticky = false }: Props) {
  const { t } = useTranslation()
  const text = t('disclaimer.text', { defaultValue: MEDICAL_DISCLAIMER })

  return (
    <Alert
      severity="info"
      icon={<WarningAmberRoundedIcon fontSize="inherit" />}
      sx={{
        borderRadius: compact ? 2 : 3,
        py: compact ? 0.5 : 1.25,
        bgcolor: (theme) =>
          theme.palette.mode === 'light' ? 'rgba(13, 148, 136, 0.08)' : 'rgba(13, 148, 136, 0.16)',
        border: '1px solid',
        borderColor: 'primary.light',
        color: 'text.primary',
        ...(sticky
          ? {
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              backdropFilter: 'blur(8px)',
            }
          : {}),
        '& .MuiAlert-icon': { color: 'primary.main', alignItems: 'center' },
      }}
    >
      {!compact && (
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>
          {t('disclaimer.title')}
        </Typography>
      )}
      <Typography variant={compact ? 'caption' : 'body2'} component={Box} sx={{ lineHeight: 1.5 }}>
        {text}
      </Typography>
    </Alert>
  )
}
