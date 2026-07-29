import { createTheme, type ThemeOptions, type PaletteMode } from '@mui/material/styles'

const teal = {
  50: '#F0FDFA',
  100: '#CCFBF1',
  200: '#99F6E4',
  300: '#5EEAD4',
  400: '#2DD4BF',
  500: '#14B8A6',
  600: '#0D9488',
  700: '#0F766E',
  800: '#115E59',
  900: '#134E4A',
}

const slate = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
}

const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: teal[600],
      light: teal[400],
      dark: teal[800],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: slate[600],
      light: slate[400],
      dark: slate[800],
    },
    success: { main: '#059669' },
    warning: { main: '#D97706' },
    error: { main: '#DC2626' },
    info: { main: '#0284C7' },
    ...(mode === 'light'
      ? {
          background: {
            default: slate[50],
            paper: 'rgba(255, 255, 255, 0.86)',
          },
          text: {
            primary: slate[900],
            secondary: slate[600],
          },
          divider: 'rgba(15, 23, 42, 0.08)',
        }
      : {
          background: {
            default: slate[900],
            paper: 'rgba(30, 41, 59, 0.88)',
          },
          text: {
            primary: slate[50],
            secondary: slate[400],
          },
          divider: 'rgba(226, 232, 240, 0.12)',
        }),
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            mode === 'light'
              ? 'radial-gradient(ellipse at 0% 0%, rgba(13, 148, 136, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(71, 85, 105, 0.08) 0%, transparent 45%), linear-gradient(160deg, #F8FAFC 0%, #F0FDFA 45%, #E2E8F0 100%)'
              : 'radial-gradient(ellipse at 10% 0%, rgba(13, 148, 136, 0.18) 0%, transparent 45%), radial-gradient(ellipse at 100% 100%, rgba(15, 23, 42, 0.9) 0%, transparent 50%), linear-gradient(165deg, #0F172A 0%, #134E4A 40%, #1E293B 100%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(10px)',
          border: mode === 'light' ? '1px solid rgba(13, 148, 136, 0.12)' : '1px solid rgba(45, 212, 191, 0.12)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(12px)',
          backgroundColor:
            mode === 'light' ? 'rgba(248, 250, 252, 0.85)' : 'rgba(15, 23, 42, 0.85)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage:
            mode === 'light'
              ? 'linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 100%)'
              : 'linear-gradient(180deg, #134E4A 0%, #0F172A 100%)',
          borderRight: mode === 'light' ? '1px solid rgba(13, 148, 136, 0.12)' : '1px solid rgba(45, 212, 191, 0.1)',
        },
      },
    },
  },
})

export function createAppTheme(mode: PaletteMode) {
  return createTheme(getDesignTokens(mode))
}

export { teal, slate }
