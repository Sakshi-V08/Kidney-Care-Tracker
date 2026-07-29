import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import AlarmIcon from '@mui/icons-material/Alarm'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { NotificationItem } from '@/types'
import { formatDateTime } from '@/utils/formatters'

interface Props {
  items: NotificationItem[]
  onMarkRead?: (id: number) => void
  onMarkAllRead?: () => void
}

function iconFor(type: NotificationItem['type']) {
  switch (type) {
    case 'alert':
    case 'warning':
      return <WarningAmberIcon color="warning" />
    case 'success':
      return <CheckCircleOutlineIcon color="success" />
    case 'reminder':
      return <AlarmIcon color="primary" />
    default:
      return <InfoOutlinedIcon color="info" />
  }
}

export default function NotificationList({ items, onMarkRead, onMarkAllRead }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const unread = items.filter((n) => !n.read).length

  if (!items.length) {
    return (
      <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
        <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
        <Typography color="text.secondary">{t('notifications.empty')}</Typography>
      </Stack>
    )
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Chip size="small" label={`${unread} ${t('notifications.unread')}`} color={unread ? 'primary' : 'default'} />
        {onMarkAllRead && unread > 0 && (
          <Button size="small" onClick={onMarkAllRead}>
            {t('notifications.markAllRead')}
          </Button>
        )}
      </Stack>
      <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
        {items.map((n) => (
          <ListItem key={n.id} disablePadding divider>
            <ListItemButton
              selected={!n.read}
              onClick={() => {
                onMarkRead?.(n.id)
                if (n.link) navigate(n.link)
              }}
            >
              <ListItemIcon>{iconFor(n.type)}</ListItemIcon>
              <ListItemText
                primary={
                  <Typography fontWeight={n.read ? 500 : 700} variant="body1">
                    {n.title}
                  </Typography>
                }
                secondary={
                  <>
                    {n.message}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {formatDateTime(n.created_at)}
                    </Typography>
                  </>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
