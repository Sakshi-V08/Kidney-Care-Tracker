import { Box } from '@mui/material'
import { PageHeader } from '@/components/common/PageExtras'
import ChatInterface from '@/components/chat/ChatInterface'

export default function ChatPage() {
  return (
    <Box>
      <PageHeader
        title="AI Chat Assistant"
        subtitle="Ask about your labs, trends, and lifestyle — informational answers only"
      />
      <ChatInterface />
    </Box>
  )
}
