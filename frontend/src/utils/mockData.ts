import type {
  AnalysisItem,
  ChatMessage,
  DashboardData,
  HealthSummary,
  LabReport,
  NotificationItem,
  Patient,
  TrackerData,
  TrendSeries,
} from '@/types'
import { MEDICAL_DISCLAIMER } from '@/types'

export const mockPatients: Patient[] = [
  {
    id: 1,
    uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    full_name: 'Aarav Sharma',
    date_of_birth: '1978-04-12',
    sex: 'M',
    blood_group: 'B+',
    height_cm: 172,
    weight_kg: 78,
    bmi: 26.4,
    ckd_stage: '3a',
    risk_level: 'moderate',
    kidney_score: 62,
    folder_name: 'aarav_sharma_1',
    primary_nephrologist: 'Dr. Mehta',
    is_active: true,
    report_count: 5,
    updated_at: '2026-07-20T10:00:00Z',
  },
  {
    id: 2,
    uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    full_name: 'Priya Patel',
    date_of_birth: '1985-09-03',
    sex: 'F',
    blood_group: 'O+',
    height_cm: 158,
    weight_kg: 64,
    bmi: 25.6,
    ckd_stage: '2',
    risk_level: 'low',
    kidney_score: 78,
    folder_name: 'priya_patel_2',
    primary_nephrologist: 'Dr. Khan',
    is_active: true,
    report_count: 3,
    updated_at: '2026-07-18T14:30:00Z',
  },
]

const trend = (base: number, variance: number, months = 8) =>
  Array.from({ length: months }, (_, i) => {
    const d = new Date(2026, i, 15)
    return {
      date: d.toISOString().slice(0, 10),
      value: Number((base + Math.sin(i / 2) * variance + i * 0.05).toFixed(2)),
    }
  })

export const mockDashboard: DashboardData = {
  patient: mockPatients[0],
  latest_kidney_stage: '3a',
  risk_level: 'moderate',
  overall_kidney_score: 62,
  recent_reports: [
    {
      id: 101,
      uuid: 'r1',
      patient: 1,
      original_filename: 'KFT_July_2026.pdf',
      report_date: '2026-07-15',
      hospital_name: 'City Care Hospital',
      doctor_name: 'Dr. Mehta',
      status: 'completed',
      created_at: '2026-07-15T09:00:00Z',
    },
    {
      id: 102,
      uuid: 'r2',
      patient: 1,
      original_filename: 'CBC_June_2026.pdf',
      report_date: '2026-06-10',
      hospital_name: 'City Care Hospital',
      doctor_name: 'Dr. Mehta',
      status: 'completed',
      created_at: '2026-06-10T09:00:00Z',
    },
  ],
  upcoming_tests: [
    {
      id: 1,
      test_name: 'Kidney Function Test',
      due_date: '2026-08-15',
      notes: 'Fasting required',
      completed: false,
    },
    {
      id: 2,
      test_name: 'Urine ACR',
      due_date: '2026-08-20',
      notes: '',
      completed: false,
    },
  ],
  abnormal_parameters: [
    { name: 'Creatinine', value: '1.8', unit: 'mg/dL', status: 'high', reference_range: '0.7–1.3' },
    { name: 'eGFR', value: '48', unit: 'mL/min/1.73m²', status: 'low', reference_range: '>60' },
    { name: 'Potassium', value: '5.3', unit: 'mEq/L', status: 'high', reference_range: '3.5–5.0' },
  ],
  historical_trends: {
    creatinine: trend(1.5, 0.2),
    egfr: trend(52, 4).map((p) => ({ ...p, value: Math.max(30, 60 - p.value + 50) })),
  },
  disclaimer: MEDICAL_DISCLAIMER,
}

export const mockTrends: TrendSeries[] = [
  { parameter: 'creatinine', label: 'Creatinine', unit: 'mg/dL', points: trend(1.5, 0.25) },
  { parameter: 'egfr', label: 'eGFR', unit: 'mL/min', points: trend(50, 5) },
  { parameter: 'urea', label: 'Urea', unit: 'mg/dL', points: trend(42, 6) },
  { parameter: 'potassium', label: 'Potassium (K)', unit: 'mEq/L', points: trend(4.6, 0.4) },
  { parameter: 'sodium', label: 'Sodium (Na)', unit: 'mEq/L', points: trend(138, 2) },
  { parameter: 'proteinuria', label: 'Proteinuria', unit: 'mg/dL', points: trend(28, 8) },
  { parameter: 'hemoglobin', label: 'Hemoglobin (Hb)', unit: 'g/dL', points: trend(12.2, 0.6) },
  { parameter: 'systolic_bp', label: 'Systolic BP', unit: 'mmHg', points: trend(132, 8) },
]

export const mockReport: LabReport = {
  id: 101,
  uuid: 'r1',
  patient: 1,
  original_filename: 'KFT_July_2026.pdf',
  report_date: '2026-07-15',
  hospital_name: 'City Care Hospital',
  doctor_name: 'Dr. Mehta',
  status: 'completed',
  created_at: '2026-07-15T09:00:00Z',
  results: [
    {
      id: 1,
      investigation_key: 'creatinine',
      investigation_name: 'Creatinine',
      category: 'kft',
      raw_value: '1.8',
      numeric_value: 1.8,
      unit: 'mg/dL',
      reference_range: '0.7–1.3',
      reference_low: 0.7,
      reference_high: 1.3,
      status_flag: 'high',
    },
    {
      id: 2,
      investigation_key: 'egfr',
      investigation_name: 'eGFR',
      category: 'kft',
      raw_value: '48',
      numeric_value: 48,
      unit: 'mL/min/1.73m²',
      reference_range: '>60',
      reference_low: 60,
      reference_high: null,
      status_flag: 'low',
    },
    {
      id: 3,
      investigation_key: 'urea',
      investigation_name: 'Blood Urea',
      category: 'kft',
      raw_value: '45',
      numeric_value: 45,
      unit: 'mg/dL',
      reference_range: '15–40',
      reference_low: 15,
      reference_high: 40,
      status_flag: 'high',
    },
    {
      id: 4,
      investigation_key: 'potassium',
      investigation_name: 'Potassium',
      category: 'kft',
      raw_value: '5.3',
      numeric_value: 5.3,
      unit: 'mEq/L',
      reference_range: '3.5–5.0',
      reference_low: 3.5,
      reference_high: 5.0,
      status_flag: 'high',
    },
    {
      id: 5,
      investigation_key: 'sodium',
      investigation_name: 'Sodium',
      category: 'kft',
      raw_value: '139',
      numeric_value: 139,
      unit: 'mEq/L',
      reference_range: '136–145',
      reference_low: 136,
      reference_high: 145,
      status_flag: 'normal',
    },
  ],
}

export const mockAnalysis: AnalysisItem[] = [
  {
    id: 1,
    investigation_key: 'creatinine',
    investigation_name: 'Creatinine',
    category: 'kft',
    value: '1.8',
    unit: 'mg/dL',
    status_flag: 'high',
    analysis_text:
      'Elevated creatinine suggests reduced glomerular filtration. Trends over serial reports help distinguish acute from chronic change.',
    clinical_significance: 'May indicate CKD stage progression when sustained.',
    recommendations: ['Discuss with nephrologist', 'Review medications affecting kidneys', 'Ensure adequate hydration unless restricted'],
  },
  {
    id: 2,
    investigation_key: 'egfr',
    investigation_name: 'eGFR',
    category: 'kft',
    value: '48',
    unit: 'mL/min/1.73m²',
    status_flag: 'low',
    analysis_text:
      'eGFR around 48 mL/min is consistent with CKD stage 3a. Monitor for anemia, bone mineral disorders, and cardiovascular risk.',
    clinical_significance: 'Stage 3a CKD educational classification.',
    recommendations: ['BP control', 'Avoid nephrotoxins', 'Periodic KFT monitoring'],
  },
  {
    id: 3,
    investigation_key: 'potassium',
    investigation_name: 'Potassium',
    category: 'kft',
    value: '5.3',
    unit: 'mEq/L',
    status_flag: 'high',
    analysis_text:
      'Mild hyperkalemia can occur with reduced kidney function or certain medications. Dietary potassium awareness may help.',
    clinical_significance: 'Monitor for cardiac symptoms if rising further.',
    recommendations: ['Review ACE/ARB/diuretics with clinician', 'Limit high-K foods if advised'],
  },
]

export const mockSummary: HealthSummary = {
  overall_assessment:
    'Recent labs suggest moderate chronic kidney impairment (educational stage 3a) with elevated creatinine and reduced eGFR. Overall kidney score is 62/100.',
  kidney_status: 'CKD stage 3a — moderate risk',
  key_findings: [
    'Creatinine elevated at 1.8 mg/dL',
    'eGFR approximately 48 mL/min/1.73m²',
    'Potassium mildly elevated at 5.3 mEq/L',
    'Sodium within normal limits',
  ],
  preventive_suggestions: [
    'Maintain blood pressure within targets set by your clinician',
    'Limit NSAID use unless prescribed',
    'Schedule follow-up KFT as recommended',
    'Discuss medication review for kidney safety',
  ],
  lifestyle_tips: [
    'Moderate sodium intake in meals',
    'Stay active with clinician-approved exercise',
    'Monitor weight and fluid intake as advised',
    'Prioritize sleep and stress management',
  ],
  follow_up_notes: [
    'Next KFT due mid-August 2026',
    'Consider urine ACR if not recently done',
  ],
  generated_at: new Date().toISOString(),
  disclaimer: MEDICAL_DISCLAIMER,
}

export const mockNotifications: NotificationItem[] = [
  {
    id: 1,
    title: 'Upcoming KFT',
    message: 'Kidney Function Test due on 15 Aug 2026.',
    type: 'reminder',
    read: false,
    created_at: '2026-07-25T08:00:00Z',
    link: '/trackers',
  },
  {
    id: 2,
    title: 'Abnormal potassium',
    message: 'Latest potassium reading is above reference range.',
    type: 'alert',
    read: false,
    created_at: '2026-07-16T10:00:00Z',
    link: '/reports/101',
  },
  {
    id: 3,
    title: 'Report processed',
    message: 'KFT_July_2026.pdf extraction completed.',
    type: 'success',
    read: true,
    created_at: '2026-07-15T09:30:00Z',
    link: '/reports/101',
  },
]

export const mockTrackers: TrackerData = {
  bp_readings: [
    { id: 1, systolic: 138, diastolic: 86, pulse: 78, recorded_at: '2026-07-27T08:00:00Z' },
    { id: 2, systolic: 132, diastolic: 82, pulse: 74, recorded_at: '2026-07-26T08:00:00Z' },
    { id: 3, systolic: 140, diastolic: 88, pulse: 80, recorded_at: '2026-07-25T08:00:00Z' },
  ],
  weight_readings: [
    { id: 1, weight_kg: 78.2, recorded_at: '2026-07-27T07:00:00Z' },
    { id: 2, weight_kg: 78.0, recorded_at: '2026-07-20T07:00:00Z' },
    { id: 3, weight_kg: 77.5, recorded_at: '2026-07-13T07:00:00Z' },
  ],
  water_logs: [
    { id: 1, amount_ml: 250, recorded_at: '2026-07-28T07:30:00Z' },
    { id: 2, amount_ml: 300, recorded_at: '2026-07-28T10:00:00Z' },
    { id: 3, amount_ml: 200, recorded_at: '2026-07-28T13:00:00Z' },
  ],
  water_goal_ml: 2000,
  medicines: [
    {
      id: 1,
      medicine_name: 'Amlodipine',
      dosage: '5 mg',
      schedule: 'Once daily morning',
      next_dose: '2026-07-29T08:00:00Z',
      active: true,
    },
    {
      id: 2,
      medicine_name: 'Losartan',
      dosage: '50 mg',
      schedule: 'Once daily evening',
      next_dose: '2026-07-28T20:00:00Z',
      active: true,
    },
  ],
  appointments: [
    {
      id: 1,
      title: 'Nephrology follow-up',
      doctor_name: 'Dr. Mehta',
      location: 'City Care Hospital',
      scheduled_at: '2026-08-05T11:00:00Z',
      notes: 'Bring recent labs',
    },
  ],
  diet_plans: [
    {
      id: 1,
      meal: 'Breakfast',
      description: 'Oats with apple, low-sodium paneer scramble',
      calories: 380,
      sodium_mg: 220,
      potassium_mg: 350,
      protein_g: 18,
      date: '2026-07-28',
    },
    {
      id: 2,
      meal: 'Lunch',
      description: 'Brown rice, grilled fish, cucumber salad',
      calories: 520,
      sodium_mg: 400,
      potassium_mg: 480,
      protein_g: 32,
      date: '2026-07-28',
    },
  ],
}

export function mockChatReply(message: string): ChatMessage {
  const lower = message.toLowerCase()
  let content =
    'Based on educational interpretation of typical CKD stage 3a labs, focus on BP control, medication review, and scheduled follow-up. This is not a diagnosis — please consult your clinician.'
  if (lower.includes('creatinine')) {
    content =
      'Creatinine around 1.8 mg/dL is above common adult reference ranges and often accompanies reduced eGFR. Serial trends matter more than a single value. Discuss interpretation with your nephrologist.'
  } else if (lower.includes('diet') || lower.includes('food')) {
    content =
      'Kidney-friendly dietary patterns often emphasize moderated sodium and personalized protein/potassium guidance. Individual needs vary — ask a renal dietitian for a plan tailored to your labs.'
  } else if (lower.includes('water') || lower.includes('fluid')) {
    content =
      'Fluid targets depend on your stage, urine output, and clinician advice. Do not self-restrict or over-hydrate without medical guidance.'
  }
  return {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
  }
}
