import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined'
import { useTranslation } from 'react-i18next'
import type { BpReading } from '@/types'
import { formatDateTime } from '@/utils/formatters'

interface Props {
  readings: BpReading[]
  onAdd?: (reading: Omit<BpReading, 'id'>) => void
}

export default function BpTracker({ readings, onAdd }: Props) {
  const { t } = useTranslation()
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const latest = readings[0]

  const submit = () => {
    const s = Number(systolic)
    const d = Number(diastolic)
    if (!s || !d) return
    onAdd?.({
      systolic: s,
      diastolic: d,
      recorded_at: new Date().toISOString(),
    })
    setSystolic('')
    setDiastolic('')
  }

  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <MonitorHeartOutlinedIcon color="primary" />
          <Typography variant="h6">{t('trackers.bp')}</Typography>
        </Stack>
        {latest && (
          <Typography variant="h3" color="primary.main" sx={{ mb: 0.5 }}>
            {latest.systolic}/{latest.diastolic}
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              mmHg
            </Typography>
          </Typography>
        )}
        <Stack direction="row" spacing={1} sx={{ my: 2 }}>
          <TextField
            size="small"
            label={t('trackers.systolic')}
            type="number"
            value={systolic}
            onChange={(e) => setSystolic(e.target.value)}
          />
          <TextField
            size="small"
            label={t('trackers.diastolic')}
            type="number"
            value={diastolic}
            onChange={(e) => setDiastolic(e.target.value)}
          />
          <Button variant="contained" onClick={submit}>
            {t('trackers.add')}
          </Button>
        </Stack>
        <Divider />
        <List dense>
          {readings.slice(0, 5).map((r) => (
            <ListItem key={r.id} disableGutters>
              <ListItemText
                primary={`${r.systolic}/${r.diastolic} mmHg`}
                secondary={formatDateTime(r.recorded_at)}
              />
            </ListItem>
          ))}
        </List>
        {!readings.length && (
          <Box sx={{ py: 2 }}>
            <Typography color="text.secondary" variant="body2">
              No readings yet
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
