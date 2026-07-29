import {
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getPatient, getPatientFolder } from '@/api/patients'
import { getReports } from '@/api/reports'
import { useAsyncData } from '@/hooks/useAsyncData'
import { mockPatients, mockDashboard } from '@/utils/mockData'
import { formatDate, formatFileSize, riskColor, stageLabel } from '@/utils/formatters'
import { MockBanner, PageHeader } from '@/components/common/PageExtras'
import type { LabReport, Patient, PatientFolder } from '@/types'

export default function PatientDetailPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const patientId = id ?? '1'

  const fallbackPatient: Patient =
    mockPatients.find((p) => String(p.id) === patientId) ?? mockPatients[0]

  const { data: patient, isMock: mockP } = useAsyncData(
    () => getPatient(patientId),
    fallbackPatient,
    [patientId],
  )

  const fallbackFolder: PatientFolder = {
    folder: fallbackPatient.folder_name,
    path: `/patients/${fallbackPatient.folder_name}`,
    files: (mockDashboard.recent_reports ?? []).map((r) => ({
      name: r.original_filename,
      size: 240000,
      modified: Date.parse(r.created_at) / 1000,
    })),
  }

  const { data: folder, isMock: mockF } = useAsyncData(
    () => getPatientFolder(patientId),
    fallbackFolder,
    [patientId],
  )

  const { data: reports, isMock: mockR } = useAsyncData(
    () => getReports({ patient: Number(patientId) }),
    mockDashboard.recent_reports as LabReport[],
    [patientId],
  )

  const p = patient ?? fallbackPatient
  const files = folder?.files ?? []
  const reportList = reports ?? []

  return (
    <Box>
      <PageHeader title={p.full_name} subtitle={t('patients.detail')} />
      <MockBanner show={mockP || mockF || mockR} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('patients.stage')}
              </Typography>
              <Typography variant="h4">{stageLabel(p.ckd_stage)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('patients.risk')}
              </Typography>
              <Chip label={p.risk_level} color={riskColor(p.risk_level)} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('patients.score')}
              </Typography>
              <Typography variant="h4">{p.kidney_score}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('patients.folder')}: {p.folder_name}
              </Typography>
              <List>
                {files.map((f) => (
                  <ListItem key={f.name} disablePadding>
                    <ListItemButton>
                      <ListItemIcon>
                        <InsertDriveFileOutlinedIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={f.name}
                        secondary={`${formatFileSize(f.size)} · ${formatDate(new Date(f.modified * 1000).toISOString())}`}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
                {!files.length && (
                  <Typography color="text.secondary">{t('dashboard.noData')}</Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('patients.reports')}
              </Typography>
              <List>
                {reportList.map((r) => (
                  <ListItem key={r.id} disablePadding>
                    <ListItemButton onClick={() => navigate(`/reports/${r.id}`)}>
                      <ListItemText
                        primary={r.original_filename}
                        secondary={formatDate(r.report_date)}
                      />
                      <Chip size="small" label={r.status} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              <Stack spacing={0.5} sx={{ mt: 2 }}>
                {p.primary_nephrologist && (
                  <Typography variant="body2">Nephrologist: {p.primary_nephrologist}</Typography>
                )}
                {p.blood_group && (
                  <Typography variant="body2">Blood group: {p.blood_group}</Typography>
                )}
                {p.bmi != null && <Typography variant="body2">BMI: {p.bmi}</Typography>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
