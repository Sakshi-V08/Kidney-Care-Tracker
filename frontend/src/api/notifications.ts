import api from './client'
import type { NotificationItem } from '@/types'

export async function getNotifications(): Promise<NotificationItem[]> {
  const { data } = await api.get<NotificationItem[] | { results: NotificationItem[] }>(
    '/notifications/',
  )
  return Array.isArray(data) ? data : data.results
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/read/`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/read_all/')
}
