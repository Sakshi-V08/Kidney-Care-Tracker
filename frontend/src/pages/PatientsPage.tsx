import { useMemo, useState } from 'react'
import { Box, TextField } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { getPatients } from '@/api/patients'
import { useAsyncData } from '@/hooks/useAsyncData'
import { mockPatients } from '@/utils/mockData'
import PatientFolderBrowser from '@/components/patients/PatientFolderBrowser'
import { MockBanner, PageHeader } from '@/components/common/PageExtras'

export default function PatientsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const { data, loading, isMock } = useAsyncData(
    () => getPatients(search ? { search } : undefined),
    mockPatients,
    [search],
  )

  const filtered = useMemo(() => {
    const list = data ?? mockPatients
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.folder_name.toLowerCase().includes(q),
    )
  }, [data, search])

  return (
    <Box>
      <PageHeader title={t('patients.title')} subtitle={t('patients.folders')} />
      <MockBanner show={isMock} />
      <TextField
        fullWidth
        size="small"
        placeholder={t('patients.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, maxWidth: 420 }}
      />
      {loading && !data ? null : <PatientFolderBrowser patients={filtered} />}
    </Box>
  )
}
