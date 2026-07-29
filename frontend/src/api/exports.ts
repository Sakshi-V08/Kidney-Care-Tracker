import api from './client'

export type ExportFormat = 'pdf' | 'csv' | 'excel'

export async function exportData(
  format: ExportFormat,
  params?: { from?: string; to?: string },
): Promise<Blob> {
  const { data } = await api.get(`/exports/${format}/`, {
    params,
    responseType: 'blob',
  })
  return data as Blob
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
