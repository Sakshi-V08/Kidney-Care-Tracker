declare module '@mui/icons-material/*' {
  import type { SvgIconComponent } from '@mui/material/SvgIcon'
  const icon: SvgIconComponent
  export default icon
}

declare module '@mui/icons-material' {
  export * from '@mui/material/SvgIcon'
}
