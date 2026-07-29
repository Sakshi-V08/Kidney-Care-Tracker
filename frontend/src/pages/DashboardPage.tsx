import {
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getDashboard } from '@/api/patients'
import { useAsyncData } from '@/hooks/useAsyncData'
import { formatDate, riskColor, stageLabel, statusFlagColor } from '@/utils/formatters'
import { MetricCard, PageHeader } from '@/components/common/PageExtras'
import TrendChart from '@/components/charts/TrendChart'
import { Alert } from '@mui/material'

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: dash, loading, error } = useAsyncData(getDashboard)

  if (!loading && !dash) {
    return (
      <Box>
        <PageHeader title={t('dashboard.title')} />
        <Alert severity="warning">
          {error
            ? `Unable to load dashboard: ${error}`
            : 'No real laboratory data yet. Upload a report to see kidney insights. Sample values are never shown.'}
        </Alert>
      </Box>
    )
  }

  const creatinine = dash?.historical_trends?.creatinine ?? []
  const egfr = dash?.historical_trends?.egfr ?? []
  const hasData = Boolean(dash && (dash as { has_real_lab_data?: boolean }).has_real_lab_data !== false && (dash.recent_reports?.length || creatinine.length || egfr.length))

  return (
    <Box>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={dash?.patient?.full_name ? `${dash.patient.full_name}` : undefined}
      />
      {!hasData && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Upload real laboratory reports to populate this dashboard. Insights never use assumed or sample values.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard
            title={t('dashboard.kidneyStage')}
            value={stageLabel(dash?.latest_kidney_stage || 'unknown')}
            icon={<FavoriteBorderIcon />}
            chipLabel={dash?.latest_kidney_stage || 'N/A'}
            chipColor="primary"
            loading={loading}
            onClick={() => navigate('/analysis')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard
            title={t('dashboard.riskLevel')}
            value={dash?.risk_level || 'Not Available'}
            icon={<ShieldOutlinedIcon />}
            chipLabel={dash?.risk_level || 'N/A'}
            chipColor={riskColor(dash?.risk_level || 'unknown')}
            loading={loading}
            onClick={() => navigate('/summary')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard
            title={t('dashboard.overallScore')}
            value={dash?.overall_kidney_score ?? 'N/A'}
            subtitle={dash?.overall_kidney_score != null ? '/ 100' : 'No extracted labs'}
            icon={<SpeedOutlinedIcon />}
            loading={loading}
            onClick={() => navigate('/trends')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6">{t('dashboard.recentReports')}</Typography>
                <Chip
                  size="small"
                  label={t('dashboard.viewAll')}
                  onClick={() => navigate('/reports/upload')}
                  clickable
                />
              </Stack>
              <List dense>
                {(dash?.recent_reports ?? []).map((r) => (
                  <ListItem key={r.id} disablePadding>
                    <ListItemButton onClick={() => navigate(`/reports/${r.id}`)}>
                      <ListItemText
                        primary={r.original_filename}
                        secondary={`${formatDate(r.report_date)} · ${r.status}`}
                      />
                      <Chip size="small" label={r.status} color={r.status === 'completed' ? 'success' : 'default'} />
                    </ListItemButton>
                  </ListItem>
                ))}
                {!dash?.recent_reports?.length && (
                  <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>
                    {t('dashboard.uploadCta')}
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('dashboard.abnormalParams')}
              </Typography>
              <Stack spacing={1}>
                {(dash?.abnormal_parameters ?? []).map((p, idx) => {
                  const row = p as {
                    name?: string
                    investigation_name?: string
                    value?: string | number
                    standardized_value?: number
                    raw_value?: string
                    unit?: string
                    standardized_unit?: string
                    status?: string
                    status_flag?: string
                    reference_range?: string
                  }
                  const name = row.name || row.investigation_name || `Param ${idx + 1}`
                  const value = row.value ?? row.standardized_value ?? row.raw_value ?? 'Not Available'
                  const unit = row.unit || row.standardized_unit || ''
                  const status = row.status || row.status_flag || 'unknown'
                  return (
                    <Stack
                      key={`${name}-${idx}`}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ px: 1.5, py: 1, borderRadius: 2, bgcolor: 'action.hover' }}
                    >
                      <Box>
                        <Typography fontWeight={600}>{name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.reference_range ? `Ref: ${row.reference_range}` : 'Ref: Not Available'}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700}>
                          {value} {unit}
                        </Typography>
                        <Chip size="small" label={status} color={statusFlagColor(status)} />
                      </Stack>
                    </Stack>
                  )
                })}
                {!dash?.abnormal_parameters?.length && (
                  <Typography color="text.secondary" variant="body2">
                    No abnormal extracted parameters on the latest real report.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card elevation={0}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('dashboard.trendsSnippet')}
              </Typography>
              {creatinine.length || egfr.length ? (
                <TrendChart
                  series={[
                    { key: 'creatinine', label: 'Creatinine', points: creatinine, color: '#0D9488' },
                    { key: 'egfr', label: 'eGFR', points: egfr, color: '#0284C7' },
                  ]}
                  height={280}
                />
              ) : (
                <Typography color="text.secondary" variant="body2">
                  Trends appear after at least two real reports with overlapping extracted tests.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('dashboard.upcomingTests')}
              </Typography>
              <List dense>
                {(dash?.upcoming_tests ?? []).map((test) => (
                  <ListItem key={test.id} disableGutters>
                    <ListItemText
                      primary={test.test_name}
                      secondary={`${formatDate(test.due_date)}${test.notes ? ` · ${test.notes}` : ''}`}
                    />
                  </ListItem>
                ))}
                {!dash?.upcoming_tests?.length && (
                  <Typography color="text.secondary" variant="body2">
                    {t('dashboard.noData')}
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
