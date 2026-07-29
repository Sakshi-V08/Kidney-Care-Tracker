import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { downloadBlob, exportData, type ExportFormat } from '@/api/exports'
import { PageHeader } from '@/components/common/PageExtras'

export default function ExportPage() {
  const { t } = useTranslation()
  const { enqueueSnackbar } = useSnackbar()
  const [from, setFrom] = useState('2026-01-01')
  const [to, setTo] = useState('2026-07-28')
  const [loading, setLoading] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setLoading(format)
    try {
      const blob = await exportData(format, { from, to })
      const ext = format === 'excel' ? 'xlsx' : format
      downloadBlob(blob, `khis-export-${from}-to-${to}.${ext}`)
      enqueueSnackbar(t('export.success'), { variant: 'success' })
    } catch {
      enqueueSnackbar('Export failed. No sample file was generated.', { variant: 'error' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <Box>
      <PageHeader title={t('export.title')} subtitle={t('export.description')} />
      <Alert severity="info" sx={{ mb: 2 }}>
        Exports include lab history and educational summaries. Not for clinical diagnosis.
      </Alert>
      <Card elevation={0}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('export.range')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <TextField
              type="date"
              label="From"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              startIcon={<PictureAsPdfOutlinedIcon />}
              disabled={!!loading}
              onClick={() => void handleExport('pdf')}
            >
              {loading === 'pdf' ? t('common.loading') : t('export.pdf')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<TableChartOutlinedIcon />}
              disabled={!!loading}
              onClick={() => void handleExport('csv')}
            >
              {loading === 'csv' ? t('common.loading') : t('export.csv')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<GridOnOutlinedIcon />}
              disabled={!!loading}
              onClick={() => void handleExport('excel')}
            >
              {loading === 'excel' ? t('common.loading') : t('export.excel')}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
