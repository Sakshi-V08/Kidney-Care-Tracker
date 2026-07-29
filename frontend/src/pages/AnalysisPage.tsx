import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { PageHeader } from '@/components/common/PageExtras'
import { getAnalysis } from '@/api/analysis'
import { useAsyncData } from '@/hooks/useAsyncData'
import { statusFlagColor } from '@/utils/formatters'

type AnalysisRow = {
  id: number
  investigation_name: string
  current_value?: number | null
  current_unit?: string
  current_status?: string
  previous_value?: number | null
  rate_of_change?: number | null
  trend?: string
  severity?: string
  possible_clinical_meaning?: string
  possible_causes?: string
  possible_complications?: string
  urgency_level?: string
  confidence_score?: number
}

export default function AnalysisPage() {
  const { data, loading, error } = useAsyncData(getAnalysis)
  const rows = (data || []) as AnalysisRow[]

  return (
    <Box>
      <PageHeader
        title="AI Medical Analysis"
        subtitle="Per-investigation insights from extracted report values only"
      />
      <Alert severity="info" sx={{ mb: 2 }}>
        Analysis is shown only for tests extracted from your uploads. Missing tests are never invented.
      </Alert>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {!loading && rows.length === 0 && (
        <Alert severity="warning">
          No extracted investigations to analyze yet. Upload a laboratory report first.
        </Alert>
      )}
      <Stack spacing={1.5}>
        {rows.map((item) => {
          const status = item.current_status || 'unknown'
          const delta =
            item.rate_of_change != null
              ? item.rate_of_change
              : item.previous_value != null && item.current_value != null
                ? Number((item.current_value - item.previous_value).toFixed(3))
                : null
          return (
            <Accordion key={item.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography fontWeight={600}>{item.investigation_name}</Typography>
                  <Chip size="small" label={status} color={statusFlagColor(status)} />
                  {item.trend && <Chip size="small" variant="outlined" label={`Trend: ${item.trend}`} />}
                  {item.urgency_level && <Chip size="small" variant="outlined" label={item.urgency_level} />}
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Current: <strong>{item.current_value ?? 'Not Available'}</strong> {item.current_unit || ''}
                  {item.previous_value != null
                    ? ` · Previous: ${item.previous_value}`
                    : ' · Previous: Not Available'}
                  {delta != null ? ` · Δ ${delta}` : ' · Δ Not Available (need ≥2 reports)'}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Possible clinical meaning:</strong> {item.possible_clinical_meaning || '—'}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Possible causes:</strong> {item.possible_causes || '—'}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Possible complications:</strong> {item.possible_complications || '—'}
                </Typography>
                {typeof item.confidence_score === 'number' && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption">
                      Extraction confidence {(item.confidence_score * 100).toFixed(0)}%
                    </Typography>
                    <LinearProgress variant="determinate" value={item.confidence_score * 100} sx={{ mt: 0.5 }} />
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Stack>
    </Box>
  )
}
