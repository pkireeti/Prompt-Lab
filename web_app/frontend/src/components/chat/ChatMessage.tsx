import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, ThumbsUp, ThumbsDown, User, Hexagon } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {isUser ? (
        <div className="max-w-[85%] sm:max-w-[720px] ml-auto">
          <div className="bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-sm text-text-primary whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      ) : (
        <div className="max-w-[900px]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center">
              <Hexagon className="w-3.5 h-3.5 text-text-secondary" />
            </div>
            <span className="text-sm font-semibold text-text-primary">PromptLab</span>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="text-sm leading-relaxed text-text-primary prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1">
                <button onClick={handleCopy} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all" title="Copy">
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all" title="Like"><ThumbsUp className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all" title="Dislike"><ThumbsDown className="w-3.5 h-3.5" /></button>
              </div>
              {message.analytics && (
                <span className="text-xs text-text-muted tabular-nums">
                  {message.analytics.tokens_used} tokens &middot; {(message.analytics.latency_ms / 1000).toFixed(2)}s
                </span>
              )}
            </div>
          </div>
          {message.analytics && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: 'Tokens', value: message.analytics.tokens_used, sub: 'tokens used' },
                { label: 'Latency', value: `${(message.analytics.latency_ms / 1000).toFixed(2)}s`, sub: 'response time' },
                { label: 'Speed', value: `${message.analytics.generation_speed.toFixed(1)} t/s`, sub: 'tokens per second' },
                { label: 'Model', value: message.analytics.model, sub: message.analytics.model === 'ollama' ? 'local model' : 'api model' },
              ].map(m => (
                <div key={m.label} className="bg-card border border-border rounded-xl px-4 py-3">
                  <div className="text-[11px] text-text-muted font-medium mb-1">{m.label}</div>
                  <div className="text-lg font-semibold text-text-primary tabular-nums">{m.value}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">{m.sub}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
