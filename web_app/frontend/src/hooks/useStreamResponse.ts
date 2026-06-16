import { useState, useRef, useCallback } from 'react'
import type { ResponseAnalytics } from '@/types'

export function useStreamResponse() {
  const [content, setContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [analytics, setAnalytics] = useState<ResponseAnalytics | null>(null)
  const startTime = useRef(0)
  const tokenCount = useRef(0)

  const startStream = useCallback(() => {
    setContent('')
    setAnalytics(null)
    setIsStreaming(true)
    startTime.current = performance.now()
    tokenCount.current = 0
  }, [])

  const addToken = useCallback((token: string) => {
    tokenCount.current++
    setContent(prev => prev + token)
  }, [])

  const endStream = useCallback((model: string, temperature: number) => {
    const latency = performance.now() - startTime.current
    setAnalytics({
      tokens_used: tokenCount.current,
      latency_ms: Math.round(latency),
      model,
      temperature,
      generation_speed: latency > 0 ? (tokenCount.current / (latency / 1000)) : 0,
    })
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    setContent('')
    setIsStreaming(false)
    setAnalytics(null)
  }, [])

  return { content, isStreaming, analytics, startStream, addToken, endStream, reset }
}
