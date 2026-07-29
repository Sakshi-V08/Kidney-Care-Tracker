export type UserRole = 'admin' | 'doctor' | 'patient' | 'caregiver'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  phone: string
  preferred_language: string
  dark_mode: boolean
  voice_assistant_enabled: boolean
  date_joined?: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  phone?: string
  role?: UserRole
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical' | string
export type CkdStage = '1' | '2' | '3a' | '3b' | '4' | '5' | 'unknown' | string

export interface UpcomingTest {
  id: number
  test_name: string
  due_date: string
  notes: string
  completed: boolean
  created_at?: string
}

export interface Patient {
  id: number
  uuid: string
  user?: number
  full_name: string
  date_of_birth?: string
  sex?: string
  blood_group?: string
  height_cm?: number
  weight_kg?: number
  bmi?: number
  diagnosis_notes?: string
  ckd_stage: CkdStage
  risk_level: RiskLevel
  kidney_score: number
  folder_name: string
  primary_nephrologist?: string
  emergency_contact?: string
  is_active: boolean
  upcoming_tests?: UpcomingTest[]
  report_count?: number
  created_at?: string
  updated_at?: string
}

export interface PatientFolderFile {
  name: string
  size: number
  modified: number
}

export interface PatientFolder {
  folder: string
  path: string
  files: PatientFolderFile[]
}

export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'duplicate'
export type StatusFlag = 'normal' | 'low' | 'high' | 'critical' | 'unknown'

export interface LabResult {
  id: number
  investigation_key: string
  investigation_name: string
  category: string
  raw_value: string
  numeric_value: number | null
  unit: string
  standardized_value?: number | null
  standardized_unit?: string
  display_value?: string | number
  reference_range: string
  reference_low?: number | null
  reference_high?: number | null
  reference_source?: string
  status_flag: StatusFlag
  extraction_status?: string
  confidence_score?: number
  needs_review?: boolean
}

export interface LabReport {
  id: number
  uuid: string
  patient: number
  original_filename: string
  file?: string
  report_date: string | null
  hospital_name: string
  doctor_name: string
  extracted_patient_name?: string
  status: ReportStatus
  processing_error?: string
  ocr_quality?: string
  ocr_message?: string
  is_demo?: boolean
  results?: LabResult[]
  created_at: string
  updated_at?: string
}

export interface AbnormalParameter {
  name: string
  value: string
  unit: string
  status: StatusFlag
  reference_range?: string
}

export interface TrendPoint {
  date: string
  value: number
}

export interface DashboardData {
  patient?: Patient
  latest_kidney_stage: string
  risk_level: RiskLevel
  overall_kidney_score: number | null
  has_real_lab_data?: boolean
  fields_needing_review?: number
  recent_reports: LabReport[]
  upcoming_tests: UpcomingTest[]
  abnormal_parameters: AbnormalParameter[]
  historical_trends: Record<string, TrendPoint[]>
  disclaimer: string
  detail?: string
}

export interface TrendSeries {
  parameter: string
  label: string
  unit: string
  points: TrendPoint[]
}

export interface AnalysisItem {
  id: number
  investigation_key: string
  investigation_name: string
  category: string
  value: string
  unit: string
  status_flag: StatusFlag
  analysis_text: string
  clinical_significance?: string
  recommendations?: string[]
}

export interface HealthSummary {
  overall_assessment: string
  kidney_status: string
  key_findings: string[]
  preventive_suggestions: string[]
  lifestyle_tips: string[]
  follow_up_notes: string[]
  generated_at: string
  disclaimer: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface NotificationItem {
  id: number
  title: string
  message: string
  type: 'info' | 'warning' | 'alert' | 'reminder' | 'success'
  read: boolean
  created_at: string
  link?: string
}

export interface BpReading {
  id: number
  systolic: number
  diastolic: number
  pulse?: number
  recorded_at: string
  notes?: string
}

export interface WeightReading {
  id: number
  weight_kg: number
  recorded_at: string
  notes?: string
}

export interface WaterLog {
  id: number
  amount_ml: number
  recorded_at: string
}

export interface MedicineReminder {
  id: number
  medicine_name: string
  dosage: string
  schedule: string
  next_dose?: string
  active: boolean
}

export interface Appointment {
  id: number
  title: string
  doctor_name: string
  location: string
  scheduled_at: string
  notes?: string
}

export interface DietPlan {
  id: number
  meal: string
  description: string
  calories?: number
  sodium_mg?: number
  potassium_mg?: number
  protein_g?: number
  date: string
}

export interface TrackerData {
  bp_readings: BpReading[]
  weight_readings: WeightReading[]
  water_logs: WaterLog[]
  water_goal_ml: number
  medicines: MedicineReminder[]
  appointments: Appointment[]
  diet_plans: DietPlan[]
}

export const MEDICAL_DISCLAIMER =
  'This application provides educational insights based on uploaded laboratory reports. It does not diagnose diseases or replace professional medical advice. Patients should always consult a qualified healthcare provider for diagnosis and treatment decisions.'
