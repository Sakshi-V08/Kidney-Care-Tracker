import { format, parseISO, isValid } from 'date-fns'

export function formatDate(value?: string | null, pattern = 'dd MMM yyyy'): string {
  if (!value) return '—'
  try {
    const d = value.includes('T') ? parseISO(value) : parseISO(`${value}T00:00:00`)
    return isValid(d) ? format(d, pattern) : value
  } catch {
    return value
  }
}

export function formatDateTime(value?: string | null): string {
  return formatDate(value, 'dd MMM yyyy, HH:mm')
}

export function riskColor(risk: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const r = risk.toLowerCase()
  if (r === 'low') return 'success'
  if (r === 'moderate') return 'warning'
  if (r === 'high' || r === 'critical') return 'error'
  return 'info'
}

export function statusFlagColor(
  flag: string,
): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const f = flag.toLowerCase()
  if (f === 'normal') return 'success'
  if (f === 'low' || f === 'high') return 'warning'
  if (f === 'critical') return 'error'
  return 'default'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function stageLabel(stage: string): string {
  if (!stage || stage === 'unknown') return 'Unknown'
  return `Stage ${stage.toUpperCase()}`
}
