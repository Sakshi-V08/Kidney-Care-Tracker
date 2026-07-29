import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Patient } from '@/types'
import { formatDate, riskColor, stageLabel } from '@/utils/formatters'

interface Props {
  patients: Patient[]
}

export default function PatientFolderBrowser({ patients }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (!patients.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        {t('patients.noPatients')}
      </Typography>
    )
  }

  return (
    <Grid container spacing={2}>
      {patients.map((p) => (
        <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
            }}
          >
            <CardActionArea onClick={() => navigate(`/patients/${p.id}`)} sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'rgba(13, 148, 136, 0.12)',
                      color: 'primary.main',
                      flexShrink: 0,
                    }}
                  >
                    <FolderOpenOutlinedIcon />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {p.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap>
                      {p.folder_name}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 1.25 }} flexWrap="wrap" useFlexGap>
                      <Chip size="small" label={stageLabel(p.ckd_stage)} color="primary" variant="outlined" />
                      <Chip size="small" label={p.risk_level} color={riskColor(p.risk_level)} />
                      <Chip size="small" label={`${t('patients.score')}: ${p.kidney_score}`} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {p.report_count ?? 0} {t('patients.reports')}
                      {p.updated_at ? ` · ${formatDate(p.updated_at)}` : ''}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
