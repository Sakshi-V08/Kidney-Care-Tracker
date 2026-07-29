import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { PageHeader } from '@/components/common/PageExtras'
import { getSummary } from '@/api/analysis'
import { useAsyncData } from '@/hooks/useAsyncData'
import { MEDICAL_DISCLAIMER } from '@/types'

type Suggestion = string | { text?: string; evidence?: string; category?: string; disclaimer?: string }

export default function SummaryPage() {
  const { data: summary, loading, error } = useAsyncData(getSummary)

  const text =
    (summary as { summary_text?: string; overall_assessment?: string } | null)?.summary_text ||
    (summary as { overall_assessment?: string } | null)?.overall_assessment ||
    ''

  const suggestions: Suggestion[] =
    (summary as { preventive_suggestions?: Suggestion[] } | null)?.preventive_suggestions || []

  return (
    <Box>
      <PageHeader
        title="AI Health Summary"
        subtitle="Generated only from your extracted laboratory history"
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {!loading && !summary && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No summary available. Upload real reports so the system can analyze extracted values only.
        </Alert>
      )}
      {summary && (
        <>
          <Card elevation={0} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5, fontFamily: '"Fraunces", Georgia, serif' }}>
                Summary
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {text || 'Insufficient extracted data for a narrative summary.'}
              </Typography>
            </CardContent>
          </Card>
          <Card elevation={0}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5, fontFamily: '"Fraunces", Georgia, serif' }}>
                Personalized suggestions
              </Typography>
              <List>
                {suggestions.map((s, idx) => {
                  const label = typeof s === 'string' ? s : s.text || ''
                  const evidence = typeof s === 'string' ? '' : s.evidence
                  return (
                    <ListItem key={idx} alignItems="flex-start">
                      <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                        <CheckCircleOutlineIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={label}
                        secondary={
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            {evidence && <Typography variant="caption">{evidence}</Typography>}
                            <Chip size="small" label="Educational — not medical advice" variant="outlined" />
                          </Stack>
                        }
                      />
                    </ListItem>
                  )
                })}
                {!suggestions.length && (
                  <Typography color="text.secondary" variant="body2">
                    No evidence-linked suggestions yet (no abnormal extracted findings).
                  </Typography>
                )}
              </List>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                {MEDICAL_DISCLAIMER}
              </Typography>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}
