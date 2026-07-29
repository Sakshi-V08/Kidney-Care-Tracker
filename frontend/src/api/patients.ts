import api from './client'
import type { DashboardData, Patient, PatientFolder } from '@/types'

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>('/dashboard/')
  return data
}

export async function getPatients(params?: { search?: string }): Promise<Patient[]> {
  const { data } = await api.get<Patient[] | { results: Patient[] }>('/patients/', { params })
  return Array.isArray(data) ? data : data.results
}

export const listPatients = getPatients

export async function getPatient(id: number | string): Promise<Patient> {
  const { data } = await api.get<Patient>(`/patients/${id}/`)
  return data
}

export async function getPatientFolder(id: number | string): Promise<PatientFolder> {
  const { data } = await api.get<PatientFolder>(`/patients/${id}/folder/`)
  return data
}

export async function getPatientDashboard(id: number | string): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>(`/patients/${id}/dashboard/`)
  return data
}
