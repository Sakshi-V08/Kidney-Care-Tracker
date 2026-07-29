import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { getTrends } from '@/api/analysis'
import { useAsyncData } from '@/hooks/useAsyncData'
import TrendChart from '@/components/charts/TrendChart'
import { PageHeader } from '@/components/common/PageExtras'

type NormalizedTrend = {
  key: string
  label: string
  unit: string
  points: { date: string; value: number }[]
}

function normalizeTrends(raw: unknown[]): NormalizedTrend[] {
  return raw.map((item) => {
    const s = item as {
      investigation_key?: string
      parameter?: string
      label?: string
      unit?: string
      series?: { date: string; value: number; unit?: string }[]
      points?: { date: string; value: number }[]
    }
    const key = s.investigation_key || s.parameter || 'unknown'
    const points = s.series || s.points || []
    return {
      key,
      label: s.label || key.replace(/_/g, ' '),
      unit: s.unit || '',
      points,
    }
  })
}

export default function TrendsPage() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [selected, setSelected] = useState<string[]>(['creatinine', 'egfr', 'potassium', 'blood_urea'])

  const { data, error } = useAsyncData(
    async () => normalizeTrends(await getTrends({ period })),
    undefined,
    [period],
  )

  const all = data ?? []

  const series = useMemo(
    () =>
      all
        .filter((s) => selected.includes(s.key) || selected.includes(s.key.replace('blood_', '')))
        .map((s) => ({
          key: s.key,
          label: `${s.label}${s.unit ? ` (${s.unit})` : ''}`,
          points: period === 'yearly' ? s.points.filter((_, i) => i % 2 === 0) : s.points,
        })),
    [all, selected, period],
  )

  const toggleParam = (key: string) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  return (
    <Box>
      <PageHeader title={t('trends.title')} />
      <Alert severity="info" sx={{ mb: 2 }}>
        Charts use only values extracted from your uploaded reports. Trends need at least two real points.
      </Alert>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {!all.length && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No trend series available yet. Upload dated reports with overlapping tests.
        </Alert>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <ToggleButtonGroup exclusive size="small" value={period} onChange={(_, v) => v && setPeriod(v)}>
          <ToggleButton value="monthly">{t('trends.monthly')}</ToggleButton>
          <ToggleButton value="yearly">{t('trends.yearly')}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t('trends.selectParams')}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        {all.map((s) => (
          <Chip
            key={s.key}
            label={s.label}
            color={selected.includes(s.key) ? 'primary' : 'default'}
            variant={selected.includes(s.key) ? 'filled' : 'outlined'}
            onClick={() => toggleParam(s.key)}
            clickable
          />
        ))}
      </Stack>

      <Card elevation={0}>
        <CardContent>
          <TrendChart series={series} height={400} />
        </CardContent>
      </Card>
    </Box>
  )
}
