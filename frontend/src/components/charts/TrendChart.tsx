import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Box, Typography, useTheme } from '@mui/material'
import type { TrendPoint } from '@/types'
import { formatDate } from '@/utils/formatters'

interface SeriesInput {
  key: string
  label: string
  color?: string
  points: TrendPoint[]
}

interface Props {
  series: SeriesInput[]
  height?: number
  unit?: string
}

const DEFAULT_COLORS = ['#0D9488', '#0284C7', '#D97706', '#DC2626', '#7C3AED', '#059669', '#EA580C', '#475569']

export default function TrendChart({ series, height = 320, unit }: Props) {
  const theme = useTheme()

  const dateSet = new Set<string>()
  series.forEach((s) => s.points.forEach((p) => dateSet.add(p.date)))
  const dates = Array.from(dateSet).sort()

  const data = dates.map((date) => {
    const row: Record<string, string | number> = {
      date,
      label: formatDate(date, 'MMM yy'),
    }
    series.forEach((s) => {
      const point = s.points.find((p) => p.date === date)
      if (point) row[s.key] = point.value
    })
    return row
  })

  if (!data.length) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography color="text.secondary">No trend data</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="label"
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            axisLine={{ stroke: theme.palette.divider }}
          />
          <YAxis
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            axisLine={{ stroke: theme.palette.divider }}
            unit={unit ? ` ${unit}` : undefined}
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
          <Legend />
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}
