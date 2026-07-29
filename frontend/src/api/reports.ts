import api from './client'
import type { LabReport } from '@/types'

export async function getReports(params?: { patient?: number }): Promise<LabReport[]> {
  const { data } = await api.get<LabReport[] | { results: LabReport[] }>('/reports/', { params })
  return Array.isArray(data) ? data : data.results
}

export async function getReport(id: number | string): Promise<LabReport> {
  const { data } = await api.get<LabReport>(`/reports/${id}/`)
  return data
}

export async function uploadReports(
  files: File[],
  patientId?: number,
  onProgress?: (pct: number) => void,
): Promise<LabReport[]> {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  if (patientId) form.append('patient', String(patientId))
  const { data } = await api.post<{ uploaded: LabReport[] } | LabReport[]>('/reports/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
    },
  })
  if (Array.isArray(data)) return data
  return data.uploaded || []
}
