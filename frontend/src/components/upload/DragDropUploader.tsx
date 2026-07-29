import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Box,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Stack,
  Chip,
} from '@mui/material'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useTranslation } from 'react-i18next'
import { formatFileSize } from '@/utils/formatters'

interface Props {
  onUpload: (files: File[], onProgress: (pct: number) => void) => Promise<void>
  disabled?: boolean
}

export default function DragDropUploader({ onUpload, disabled }: Props) {
  const { t } = useTranslation()
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted])
    setDone(false)
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || uploading,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    multiple: true,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    setProgress(0)
    setError(null)
    try {
      await onUpload(files, setProgress)
      setDone(true)
      setFiles([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 3,
          p: { xs: 3, md: 5 },
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          bgcolor: isDragActive ? 'rgba(13, 148, 136, 0.08)' : 'background.paper',
          transition: 'border-color 0.2s, background-color 0.2s',
          '&:hover': { borderColor: 'primary.main' },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadOutlinedIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          {t('reports.uploadHint')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('reports.acceptedTypes')}
        </Typography>
      </Box>

      {files.length > 0 && (
        <List dense sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
          {files.map((file, i) => (
            <ListItem
              key={`${file.name}-${i}`}
              secondaryAction={
                <IconButton edge="end" onClick={() => removeFile(i)} disabled={uploading}>
                  <DeleteOutlineIcon />
                </IconButton>
              }
            >
              <ListItemIcon>
                <InsertDriveFileOutlinedIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary={file.name} secondary={formatFileSize(file.size)} />
            </ListItem>
          ))}
        </List>
      )}

      {uploading && (
        <Box>
          <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1, height: 8 }} />
          <Typography variant="caption" color="text.secondary">
            {progress}%
          </Typography>
        </Box>
      )}

      {error && <Chip color="error" label={error} />}
      {done && <Chip color="success" label="Upload complete" />}

      <Button
        variant="contained"
        size="large"
        disabled={!files.length || uploading || disabled}
        onClick={() => void handleUpload()}
        startIcon={<CloudUploadOutlinedIcon />}
      >
        {uploading ? t('reports.processing') : t('reports.upload')}
      </Button>
    </Stack>
  )
}
