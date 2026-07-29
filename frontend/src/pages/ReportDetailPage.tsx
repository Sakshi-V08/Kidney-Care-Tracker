import { useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useAsyncData } from '@/hooks/useAsyncData'
import { getReport } from '@/api/reports'
import { PageHeader } from '@/components/common/PageExtras'
import { formatDate, statusFlagColor } from '@/utils/formatters'

export default function ReportDetailPage() {
  const { id } = useParams()
  const { data, loading, error } = useAsyncData(() => getReport(Number(id)), undefined, [id])

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!data) {
    return (
      <Alert severity="error">{error || 'Report not found. No sample report is shown.'}</Alert>
    )
  }

  const report = data as typeof data & {
    ocr_quality?: string
    ocr_message?: string
    extracted_patient_name?: string
    results?: Array<{
      id: number
      investigation_name: string
      raw_value: string
      standardized_value?: number | null
      standardized_unit?: string
      unit?: string
      reference_range?: string
      status_flag: string
      confidence_score?: number
      needs_review?: boolean
      extraction_status?: string
    }>
  }

  return (
    <Box>
      <PageHeader
        title={report.original_filename}
        subtitle={`${report.hospital_name || 'Not Available'} · ${formatDate(report.report_date)} · ${report.doctor_name || 'Not Available'}`}
      />
      {report.ocr_message && (
        <Alert
          severity={report.ocr_quality === 'poor' || report.ocr_quality === 'failed' ? 'warning' : 'info'}
          sx={{ mb: 2 }}
        >
          {report.ocr_message}
        </Alert>
      )}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Chip label={report.status} color={report.status === 'completed' ? 'success' : 'default'} size="small" />
        {report.ocr_quality && <Chip label={`OCR: ${report.ocr_quality}`} size="small" variant="outlined" />}
        {report.extracted_patient_name && (
          <Chip label={`Patient on report: ${report.extracted_patient_name}`} size="small" variant="outlined" />
        )}
      </Stack>
      <Card elevation={0}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontFamily: '"Fraunces", Georgia, serif' }}>
            Extracted laboratory values
          </Typography>
          {!report.results?.length ? (
            <Typography color="text.secondary">
              Unable to Extract — no values were assumed from this file.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Investigation</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Confidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.results.map((r) => (
                  <TableRow
                    key={r.id}
                    sx={{ bgcolor: r.needs_review ? 'rgba(217, 119, 6, 0.08)' : undefined }}
                  >
                    <TableCell>
                      {r.investigation_name}
                      {r.needs_review && (
                        <Chip size="small" label="Review" color="warning" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell>{r.standardized_value ?? r.raw_value ?? 'Not Available'}</TableCell>
                    <TableCell>{r.standardized_unit || r.unit || 'Not Available'}</TableCell>
                    <TableCell>{r.reference_range || 'Not Available'}</TableCell>
                    <TableCell>
                      <Chip size="small" label={r.status_flag} color={statusFlagColor(r.status_flag)} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 100 }}>
                      <Typography variant="caption">
                        {Math.round((r.confidence_score || 0) * 100)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(r.confidence_score || 0) * 100}
                        sx={{ mt: 0.5 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
