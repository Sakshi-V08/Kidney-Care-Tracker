import { useState } from 'react'
import { Box } from '@mui/material'
import { useTranslation } from 'react-i18next'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications'
import { useAsyncData } from '@/hooks/useAsyncData'
import { mockNotifications } from '@/utils/mockData'
import NotificationList from '@/components/notifications/NotificationList'
import { MockBanner, PageHeader } from '@/components/common/PageExtras'
import type { NotificationItem } from '@/types'

export default function NotificationsPage() {
  const { t } = useTranslation()
  const { data, isMock, reload } = useAsyncData(getNotifications, mockNotifications)
  const [local, setLocal] = useState<NotificationItem[] | null>(null)
  const items = local ?? data ?? mockNotifications

  return (
    <Box>
      <PageHeader title={t('notifications.title')} />
      <MockBanner show={isMock} />
      <NotificationList
        items={items}
        onMarkRead={(id) => {
          setLocal(items.map((n) => (n.id === id ? { ...n, read: true } : n)))
          void markNotificationRead(id).catch(() => undefined)
        }}
        onMarkAllRead={() => {
          setLocal(items.map((n) => ({ ...n, read: true })))
          void markAllNotificationsRead()
            .then(() => reload())
            .catch(() => undefined)
        }}
      />
    </Box>
  )
}
