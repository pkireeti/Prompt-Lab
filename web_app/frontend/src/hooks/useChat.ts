import { useState, useCallback, useRef } from 'react'
import type { ChatMessage, GenerationOptions, ResponseAnalytics } from '@/types'
import { api } from '@/lib/api'
import { generateId } from '@/lib/utils'

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setStreamingContent('')
  }, [])

  const sendMessage = useCallback(async (text: string, options: GenerationOptions, extras?: { apiKey?: string; useApi?: boolean; apiModel?: string; apiBaseUrl?: string }) => {
    if (!text.trim() || isStreaming) return

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    addMessage(userMsg)
    setIsStreaming(true)
    setStreamingContent('')

    const assistantId = generateId()
    const startTime = performance.now()
    let tokenCount = 0

    try {
      const res = await api.sendMessage(sessionId, text, options, extras)

      if (options.stream && res.body) {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6))
              if (data.token) {
                fullContent += data.token
                tokenCount++
                setStreamingContent(fullContent)
              }
              if (data.done) {
                const latency = performance.now() - startTime
                const analytics: ResponseAnalytics = {
                  tokens_used: tokenCount,
                  latency_ms: Math.round(latency),
                  model: extras?.useApi ? (extras?.apiModel || 'api') : 'ollama',
                  temperature: options.temperature,
                  generation_speed: latency > 0 ? (tokenCount / (latency / 1000)) : 0,
                }
                const assistantMsg: ChatMessage = {
                  id: assistantId,
                  role: 'assistant',
                  content: fullContent,
                  timestamp: Date.now(),
                  analytics,
                }
                setMessages(prev => [...prev, assistantMsg])
                setStreamingContent('')
                setIsStreaming(false)
              }
              if (data.error) {
                const errorMsg: ChatMessage = {
                  id: assistantId,
                  role: 'assistant',
                  content: `Error: ${data.error}`,
                  timestamp: Date.now(),
                }
                setMessages(prev => [...prev, errorMsg])
                setStreamingContent('')
                setIsStreaming(false)
              }
            } catch (_) {}
          }
        }
      } else {
        const data = await res.json()
        const latency = performance.now() - startTime
        const content = data.reply || 'No response'
        tokenCount = content.split(' ').length
        const analytics: ResponseAnalytics = {
          tokens_used: tokenCount,
          latency_ms: Math.round(latency),
          model: extras?.useApi ? (extras?.apiModel || 'api') : 'ollama',
          temperature: options.temperature,
          generation_speed: latency > 0 ? (tokenCount / (latency / 1000)) : 0,
        }
        const assistantMsg: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content,
          timestamp: Date.now(),
          analytics,
        }
        setMessages(prev => [...prev, assistantMsg])
        setIsStreaming(false)
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: `Error: ${err.message}`,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, errorMsg])
      setIsStreaming(false)
      setStreamingContent('')
    }
  }, [sessionId, isStreaming, addMessage])

  return {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    clearMessages,
  }
}

export type { ChatMessage }
