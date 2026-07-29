import { Alert, Box, Card, CardContent, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import DragDropUploader from '@/components/upload/DragDropUploader'
import { uploadReports } from '@/api/reports'
import { getPatients } from '@/api/patients'
import { PageHeader } from '@/components/common/PageExtras'
import { useAuthStore } from '@/store/authStore'
import { useEffect, useState } from 'react'

export default function UploadReportPage() {
  const { t } = useTranslation()
  const { enqueueSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [patientId, setPatientId] = useState<number | undefined>()

  useEffect(() => {
    void getPatients()
      .then((list) => {
        if (list[0]?.id) setPatientId(list[0].id)
      })
      .catch(() => setPatientId(undefined))
  }, [user?.id])

  return (
    <Box>
      <PageHeader title={t('reports.upload')} subtitle={t('reports.uploadHint')} />
      <Alert severity="info" sx={{ mb: 2 }}>
        Upload a real PDF or scanned lab report. The system extracts values from your file only —
        it will never invent missing results. Unreadable fields are marked for manual review.
      </Alert>
      {!patientId && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No patient profile found. Create/link a patient record before uploading.
        </Alert>
      )}
      <Card elevation={0}>
        <CardContent>
          <DragDropUploader
            onUpload={async (files, onProgress) => {
              if (!patientId) {
                enqueueSnackbar('Patient required before upload', { variant: 'error' })
                throw new Error('Patient required')
              }
              try {
                const reports = await uploadReports(files, patientId, onProgress)
                enqueueSnackbar(
                  'Upload received — OCR extraction started. Insights use extracted values only.',
                  { variant: 'success' },
                )
                if (reports[0]?.id) navigate(`/reports/${reports[0].id}`)
              } catch (err) {
                enqueueSnackbar(
                  err instanceof Error
                    ? `Upload failed: ${err.message}`
                    : 'Upload failed. No sample data was used.',
                  { variant: 'error' },
                )
                throw err
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
            Supported: PDF and images. Analysis and trends appear only after successful extraction.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
