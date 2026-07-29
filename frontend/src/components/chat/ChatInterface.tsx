import { useEffect, useRef, useState } from 'react'
import {
  Box,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Avatar,
} from '@mui/material'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import { useTranslation } from 'react-i18next'
import type { ChatMessage } from '@/types'
import { sendChatMessage } from '@/api/chat'
import { formatDateTime } from '@/utils/formatters'
import MedicalDisclaimer from '@/components/disclaimer/MedicalDisclaimer'

export default function ChatInterface() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t('chat.empty'),
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setSending(true)
    try {
      const reply = await sendChatMessage(text)
      setMessages((m) => [...m, reply])
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            'I could not reach the analysis service. No sample answer was generated. Please ensure the API is running and that you have uploaded real reports.',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <Stack spacing={2} sx={{ height: { xs: '70vh', md: 'calc(100vh - 220px)' }, minHeight: 420 }}>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          return (
            <Stack
              key={msg.id}
              direction="row"
              spacing={1.5}
              justifyContent={isUser ? 'flex-end' : 'flex-start'}
              alignItems="flex-start"
            >
              {!isUser && (
                <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                  <SmartToyOutlinedIcon fontSize="small" />
                </Avatar>
              )}
              <Box
                sx={{
                  maxWidth: '75%',
                  px: 2,
                  py: 1.25,
                  borderRadius: 2.5,
                  bgcolor: isUser ? 'primary.main' : 'action.hover',
                  color: isUser ? 'primary.contrastText' : 'text.primary',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.7, display: 'block', mt: 0.5, textAlign: 'right' }}
                >
                  {formatDateTime(msg.timestamp)}
                </Typography>
              </Box>
              {isUser && (
                <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                  <PersonOutlineIcon fontSize="small" />
                </Avatar>
              )}
            </Stack>
          )
        })}
        {sending && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="caption" color="text.secondary">
              {t('chat.thinking')}
            </Typography>
          </Stack>
        )}
        <div ref={bottomRef} />
      </Paper>

      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="medium"
          placeholder={t('chat.placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void handleSend()
            }
          }}
          disabled={sending}
        />
        <IconButton
          color="primary"
          onClick={() => void handleSend()}
          disabled={!input.trim() || sending}
          sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, width: 48, height: 48 }}
        >
          <SendRoundedIcon />
        </IconButton>
      </Stack>
      <MedicalDisclaimer compact />
    </Stack>
  )
}
