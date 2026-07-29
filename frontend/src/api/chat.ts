import api from './client'
import type { ChatMessage } from '@/types'

interface ChatResponse {
  session: number
  reply: string
  messages: { id: number; role: string; content: string; created_at: string }[]
}

export async function sendChatMessage(message: string, patient?: number, session?: number): Promise<ChatMessage> {
  const { data } = await api.post<ChatResponse>('/chat/', { message, patient, session })
  return {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: data.reply,
    timestamp: new Date().toISOString(),
  }
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  const { data } = await api.get<{ messages?: ChatMessage[] }[] | { results: unknown[] }>('/chat/sessions/')
  const sessions = Array.isArray(data) ? data : []
  const first = sessions[0] as { messages?: { id: number; role: string; content: string; created_at: string }[] }
  return (first?.messages || []).map((m) => ({
    id: String(m.id),
    role: m.role as ChatMessage['role'],
    content: m.content,
    timestamp: m.created_at,
  }))
}
