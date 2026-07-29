import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined'
import { useTranslation } from 'react-i18next'
import type { WaterLog } from '@/types'

interface Props {
  logs: WaterLog[]
  goalMl: number
  onAdd?: (amount: number) => void
}

export default function WaterTracker({ logs, goalMl, onAdd }: Props) {
  const { t } = useTranslation()
  const today = new Date().toISOString().slice(0, 10)
  const todayTotal = logs
    .filter((l) => l.recorded_at.startsWith(today))
    .reduce((sum, l) => sum + l.amount_ml, 0)
  const pct = Math.min(100, Math.round((todayTotal / goalMl) * 100))

  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <WaterDropOutlinedIcon color="primary" />
          <Typography variant="h6">{t('trackers.water')}</Typography>
        </Stack>
        <Typography variant="h3" color="primary.main">
          {todayTotal}
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            / {goalMl} ml
          </Typography>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('trackers.goal')}: {goalMl} ml · {pct}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ mt: 1.5, mb: 2, height: 10, borderRadius: 5 }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {[150, 250, 300, 500].map((amt) => (
            <Button key={amt} variant="outlined" size="small" onClick={() => onAdd?.(amt)}>
              +{amt} ml
            </Button>
          ))}
        </Stack>
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Today&apos;s logs: {logs.filter((l) => l.recorded_at.startsWith(today)).length}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
