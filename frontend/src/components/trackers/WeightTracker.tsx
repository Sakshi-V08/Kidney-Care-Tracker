import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import MonitorWeightOutlinedIcon from '@mui/icons-material/MonitorWeightOutlined'
import { useTranslation } from 'react-i18next'
import type { WeightReading } from '@/types'
import { formatDateTime } from '@/utils/formatters'

interface Props {
  readings: WeightReading[]
  onAdd?: (reading: Omit<WeightReading, 'id'>) => void
}

export default function WeightTracker({ readings, onAdd }: Props) {
  const { t } = useTranslation()
  const [weight, setWeight] = useState('')
  const latest = readings[0]
  const delta =
    readings.length >= 2 ? Number((readings[0].weight_kg - readings[1].weight_kg).toFixed(1)) : null

  const submit = () => {
    const w = Number(weight)
    if (!w) return
    onAdd?.({ weight_kg: w, recorded_at: new Date().toISOString() })
    setWeight('')
  }

  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <MonitorWeightOutlinedIcon color="primary" />
          <Typography variant="h6">{t('trackers.weight')}</Typography>
        </Stack>
        {latest && (
          <Typography variant="h3" color="primary.main">
            {latest.weight_kg}
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              kg
              {delta !== null && (
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ ml: 1, color: delta > 0 ? 'warning.main' : 'success.main' }}
                >
                  {delta > 0 ? '+' : ''}
                  {delta} kg
                </Typography>
              )}
            </Typography>
          </Typography>
        )}
        <Stack direction="row" spacing={1} sx={{ my: 2 }}>
          <TextField
            size="small"
            label="kg"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={submit}>
            {t('trackers.add')}
          </Button>
        </Stack>
        <Divider />
        <List dense>
          {readings.slice(0, 5).map((r) => (
            <ListItem key={r.id} disableGutters>
              <ListItemText primary={`${r.weight_kg} kg`} secondary={formatDateTime(r.recorded_at)} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}
