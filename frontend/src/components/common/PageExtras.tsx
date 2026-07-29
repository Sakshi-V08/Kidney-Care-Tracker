import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import type { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  chipLabel?: string
  chipColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  onClick?: () => void
  loading?: boolean
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  chipLabel,
  chipColor = 'primary',
  onClick,
  loading,
}: MetricCardProps) {
  const content = (
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {title}
        </Typography>
        {icon && (
          <Box sx={{ color: 'primary.main', opacity: 0.9 }}>{icon}</Box>
        )}
      </Stack>
      {loading ? (
        <Skeleton width="60%" height={48} />
      ) : (
        <Typography
          variant="h3"
          sx={{ mt: 1, mb: 0.5, fontFamily: '"Fraunces", Georgia, serif', color: 'primary.dark' }}
        >
          {value}
        </Typography>
      )}
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        {chipLabel && <Chip size="small" label={chipLabel} color={chipColor} />}
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
    </CardContent>
  )

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        ...(onClick
          ? {
              '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 },
            }
          : {}),
      }}
    >
      {onClick ? <CardActionArea onClick={onClick} sx={{ height: '100%' }}>{content}</CardActionArea> : content}
    </Card>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  )
}

export function MockBanner({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      Showing sample data (API unavailable)
    </Alert>
  )
}
