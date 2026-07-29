import api from './client'
import type {
  Appointment,
  BpReading,
  DietPlan,
  MedicineReminder,
  TrackerData,
  WaterLog,
  WeightReading,
} from '@/types'

function unwrap<T>(d: T[] | { results: T[] }): T[] {
  return Array.isArray(d) ? d : d.results || []
}

export async function getTrackers(): Promise<TrackerData> {
  const [bp, weight, water, medicines, appointments, diet] = await Promise.all([
    api.get('/trackers/bp/'),
    api.get('/trackers/weight/'),
    api.get('/trackers/water/'),
    api.get('/trackers/medicines/'),
    api.get('/trackers/appointments/'),
    api.get('/trackers/diet/'),
  ])

  return {
    bp_readings: unwrap<Record<string, unknown>>(bp.data).map((r) => ({
      id: Number(r.id),
      systolic: Number(r.systolic),
      diastolic: Number(r.diastolic),
      pulse: r.pulse != null ? Number(r.pulse) : undefined,
      recorded_at: String(r.measured_at || r.recorded_at || ''),
      notes: r.notes ? String(r.notes) : undefined,
    })),
    weight_readings: unwrap<Record<string, unknown>>(weight.data).map((r) => ({
      id: Number(r.id),
      weight_kg: Number(r.weight_kg),
      recorded_at: String(r.measured_at || r.recorded_at || ''),
      notes: r.notes ? String(r.notes) : undefined,
    })),
    water_logs: unwrap<Record<string, unknown>>(water.data).map((r) => ({
      id: Number(r.id),
      amount_ml: Number(r.amount_ml),
      recorded_at: String(r.recorded_at || ''),
    })),
    water_goal_ml: 2000,
    medicines: unwrap<MedicineReminder>(medicines.data),
    appointments: unwrap<Record<string, unknown>>(appointments.data).map((a) => ({
      id: Number(a.id),
      title: String(a.title || 'Appointment'),
      doctor_name: String(a.doctor_name || ''),
      location: String(a.location || ''),
      scheduled_at: String(a.scheduled_at || ''),
      notes: a.notes ? String(a.notes) : undefined,
    })),
    diet_plans: unwrap<Record<string, unknown>>(diet.data).map((d) => ({
      id: Number(d.id),
      meal: String(d.title || d.meal || 'Diet plan'),
      description: Array.isArray(d.guidelines) ? (d.guidelines as string[]).join(' · ') : String(d.description || ''),
      date: String(d.created_at || d.date || ''),
    })),
  }
}

export async function addBpReading(payload: Omit<BpReading, 'id'>): Promise<BpReading> {
  const { data } = await api.post<BpReading>('/trackers/bp/', {
    ...payload,
    measured_at: payload.recorded_at,
  })
  return data
}

export async function addWeightReading(payload: Omit<WeightReading, 'id'>): Promise<WeightReading> {
  const { data } = await api.post<WeightReading>('/trackers/weight/', {
    ...payload,
    measured_at: payload.recorded_at,
  })
  return data
}

export async function addWaterLog(payload: Omit<WaterLog, 'id'>): Promise<WaterLog> {
  const { data } = await api.post<WaterLog>('/trackers/water/', payload)
  return data
}

export async function addMedicine(payload: Omit<MedicineReminder, 'id'>): Promise<MedicineReminder> {
  const { data } = await api.post<MedicineReminder>('/trackers/medicines/', payload)
  return data
}

export async function addAppointment(payload: Omit<Appointment, 'id'>): Promise<Appointment> {
  const { data } = await api.post<Appointment>('/trackers/appointments/', payload)
  return data
}

export async function addDietPlan(payload: Omit<DietPlan, 'id'>): Promise<DietPlan> {
  const { data } = await api.post<DietPlan>('/trackers/diet/', payload)
  return data
}
