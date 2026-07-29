import api from './client'
import type { AnalysisItem, HealthSummary, TrendSeries } from '@/types'

export async function getTrends(params?: {
  period?: 'monthly' | 'yearly'
  parameters?: string
}): Promise<TrendSeries[]> {
  const { data } = await api.get<
    TrendSeries[] | { results: TrendSeries[] } | { trends: Array<{ investigation_key: string; series: TrendSeries['points'] }> }
  >('/trends/', { params })

  if (Array.isArray(data)) {
    return data.map((item) => {
      const anyItem = item as TrendSeries & {
        investigation_key?: string
        series?: TrendSeries['points']
      }
      return {
        parameter: anyItem.parameter || anyItem.investigation_key || 'unknown',
        label: anyItem.label || anyItem.parameter || anyItem.investigation_key || 'Unknown',
        unit: anyItem.unit || '',
        points: anyItem.points || anyItem.series || [],
      }
    })
  }
  if ('results' in data && Array.isArray(data.results)) return data.results
  if ('trends' in data && Array.isArray(data.trends)) {
    return data.trends.map((t) => ({
      parameter: t.investigation_key,
      label: t.investigation_key,
      unit: '',
      points: t.series || [],
    }))
  }
  return []
}

export async function getAnalysis(): Promise<AnalysisItem[]> {
  const { data } = await api.get<AnalysisItem[] | { results: AnalysisItem[] }>('/analysis/')
  return Array.isArray(data) ? data : data.results
}

export async function getSummary(): Promise<HealthSummary> {
  const { data } = await api.get<HealthSummary>('/summary/')
  return data
}
