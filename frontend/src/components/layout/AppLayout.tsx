import { useMemo, useState, type ReactNode } from 'react'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined'
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined'
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined'
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import MedicalDisclaimer from '@/components/disclaimer/MedicalDisclaimer'

const DRAWER_WIDTH = 260

interface NavItem {
  key: string
  path: string
  icon: ReactNode
  adminOnly?: boolean
}

export default function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const mode = useThemeStore((s) => s.mode)
  const toggleMode = useThemeStore((s) => s.toggleMode)

  const isAdmin = user?.role === 'admin' || user?.role === 'doctor'

  const navItems: NavItem[] = useMemo(
    () => [
      { key: 'dashboard', path: '/dashboard', icon: <DashboardOutlinedIcon /> },
      { key: 'patients', path: '/patients', icon: <PeopleOutlineIcon />, adminOnly: true },
      { key: 'upload', path: '/reports/upload', icon: <CloudUploadOutlinedIcon /> },
      { key: 'trends', path: '/trends', icon: <ShowChartOutlinedIcon /> },
      { key: 'analysis', path: '/analysis', icon: <PsychologyOutlinedIcon /> },
      { key: 'summary', path: '/summary', icon: <SummarizeOutlinedIcon /> },
      { key: 'chat', path: '/chat', icon: <ChatOutlinedIcon /> },
      { key: 'notifications', path: '/notifications', icon: <NotificationsNoneIcon /> },
      { key: 'trackers', path: '/trackers', icon: <FitnessCenterOutlinedIcon /> },
      { key: 'export', path: '/export', icon: <FileDownloadOutlinedIcon /> },
      { key: 'settings', path: '/settings', icon: <SettingsOutlinedIcon /> },
      { key: 'admin', path: '/admin', icon: <AdminPanelSettingsOutlinedIcon />, adminOnly: true },
    ],
    [],
  )

  const visible = navItems.filter((n) => !n.adminOnly || isAdmin)

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Typography
          variant="h5"
          sx={{ fontFamily: '"Fraunces", Georgia, serif', color: 'primary.main', fontWeight: 700 }}
        >
          {t('app.name')}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
          {t('app.fullName')}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {visible.map((item) => {
          const selected =
            location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
          return (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={selected}
              onClick={() => isMobile && setOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(13, 148, 136, 0.14)',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={t(`nav.${item.key}`)} />
            </ListItemButton>
          )
        })}
      </List>
      <Box sx={{ p: 2 }}>
        <MedicalDisclaimer compact />
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        color="transparent"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, fontFamily: '"Fraunces", Georgia, serif' }}>
            {t('app.name')}
          </Typography>
          <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
            <IconButton onClick={toggleMode} sx={{ mr: 1 }}>
              {mode === 'light' ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={t('nav.notifications')}>
            <IconButton onClick={() => navigate('/notifications')} sx={{ mr: 1 }}>
              <Badge color="error" variant="dot">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Avatar
            sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14, mr: 1 }}
          >
            {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
          </Avatar>
          <Tooltip title={t('nav.logout')}>
            <IconButton
              onClick={() => {
                void logout().then(() => navigate('/login'))
              }}
            >
              <LogoutOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={open}
            onClose={() => setOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            open
            sx={{
              '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
            }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
        <Box sx={{ px: { xs: 2, md: 3 }, pb: 2 }}>
          <MedicalDisclaimer sticky />
        </Box>
      </Box>
    </Box>
  )
}
