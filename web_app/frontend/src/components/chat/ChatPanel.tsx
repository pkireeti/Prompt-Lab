import { useEffect, useRef } from 'react'
import { ChatMessage } from './ChatMessage'
import { TypingIndicator } from './TypingIndicator'
import type { ChatMessage as ChatMessageType } from '@/types'

interface ChatPanelProps {
  messages: ChatMessageType[]
  isStreaming: boolean
  streamingContent: string
}

export function ChatPanel({ messages, isStreaming, streamingContent }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
      <div className="w-full max-w-[900px] mx-auto">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isStreaming && streamingContent && (
          <ChatMessage
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              timestamp: Date.now(),
            }}
          />
        )}

        {isStreaming && !streamingContent && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
