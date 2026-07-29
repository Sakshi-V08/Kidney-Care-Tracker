import {
  Box,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getPatients } from '@/api/patients'
import { useAsyncData } from '@/hooks/useAsyncData'
import { mockPatients } from '@/utils/mockData'
import { formatDate, riskColor, stageLabel } from '@/utils/formatters'
import { MetricCard, MockBanner, PageHeader } from '@/components/common/PageExtras'

export default function AdminPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, isMock } = useAsyncData(getPatients, mockPatients)
  const patients = data ?? mockPatients

  const avgScore = Math.round(
    patients.reduce((s, p) => s + (p.kidney_score || 0), 0) / Math.max(patients.length, 1),
  )
  const highRisk = patients.filter((p) =>
    ['high', 'critical'].includes(String(p.risk_level).toLowerCase()),
  ).length
  const totalReports = patients.reduce((s, p) => s + (p.report_count || 0), 0)

  return (
    <Box>
      <PageHeader title={t('admin.title')} subtitle={t('admin.multiPatient')} />
      <MockBanner show={isMock} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard title="Active patients" value={patients.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard title="Avg kidney score" value={avgScore} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard
            title="High risk"
            value={highRisk}
            chipLabel={`${totalReports} reports`}
            chipColor="warning"
          />
        </Grid>
      </Grid>

      <Card elevation={0}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('admin.stats')}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Reports</TableCell>
                <TableCell>Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patients.map((p) => (
                <TableRow
                  key={p.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/patients/${p.id}`)}
                >
                  <TableCell>
                    <Typography fontWeight={600}>{p.full_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.folder_name}
                    </Typography>
                  </TableCell>
                  <TableCell>{stageLabel(p.ckd_stage)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={p.risk_level} color={riskColor(p.risk_level)} />
                  </TableCell>
                  <TableCell>{p.kidney_score}</TableCell>
                  <TableCell>{p.report_count ?? 0}</TableCell>
                  <TableCell>{formatDate(p.updated_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
