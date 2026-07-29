import { Box, Card, CardContent, List, ListItem, ListItemText, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { PageHeader, MockBanner } from '@/components/common/PageExtras'
import BpTracker from '@/components/trackers/BpTracker'
import WeightTracker from '@/components/trackers/WeightTracker'
import WaterTracker from '@/components/trackers/WaterTracker'
import { useAsyncData } from '@/hooks/useAsyncData'
import { getTrackers } from '@/api/trackers'
import { mockTrackers } from '@/utils/mockData'

export default function TrackersPage() {
  const { data, isMock } = useAsyncData(getTrackers, mockTrackers)
  const trackers = data || mockTrackers

  return (
    <Box>
      <PageHeader title="Health Trackers" subtitle="Blood pressure, weight, water, medicines & appointments" />
      <MockBanner show={isMock} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <BpTracker readings={trackers.bp_readings || []} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <WeightTracker readings={trackers.weight_readings || []} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <WaterTracker logs={trackers.water_logs || []} goalMl={trackers.water_goal_ml || 2000} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, fontFamily: '"Fraunces", Georgia, serif' }}>
                Medicine reminders
              </Typography>
              <List dense>
                {(trackers.medicines || []).map((m) => (
                  <ListItem key={m.id}>
                    <ListItemText primary={`${m.medicine_name} — ${m.dosage}`} secondary={m.schedule} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, fontFamily: '"Fraunces", Georgia, serif' }}>
                Appointments
              </Typography>
              <List dense>
                {(trackers.appointments || []).map((a) => (
                  <ListItem key={a.id}>
                    <ListItemText
                      primary={`${a.doctor_name || (a as { title?: string }).title}`}
                      secondary={`${a.scheduled_at} · ${a.location || ''}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Card elevation={0}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, fontFamily: '"Fraunces", Georgia, serif' }}>
                Diet planner
              </Typography>
              <List dense>
                {(trackers.diet_plans || []).map((d) => (
                  <ListItem key={d.id}>
                    <ListItemText
                      primary={(d as { title?: string; meal?: string }).title || d.meal}
                      secondary={
                        (d as { guidelines?: string[]; description?: string }).description ||
                        ((d as { guidelines?: string[] }).guidelines || []).join(' · ')
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
