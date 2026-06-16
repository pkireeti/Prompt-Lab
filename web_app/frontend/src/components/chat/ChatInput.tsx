import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowUp, Paperclip, SlidersHorizontal, Square } from 'lucide-react'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled: boolean
  isStreaming: boolean
  onToggleParams?: () => void
}

export function ChatInput({ onSend, disabled, isStreaming, onToggleParams }: ChatInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!disabled && !isStreaming) textareaRef.current?.focus()
  }, [disabled, isStreaming])

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 200) + 'px' }
  }, [])

  useEffect(() => { adjustHeight() }, [text, adjustHeight])

  const handleSend = useCallback(() => {
    if (!text.trim() || disabled || isStreaming) return
    onSend(text.trim())
    setText('')
  }, [text, disabled, isStreaming, onSend])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }, [handleSend])

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-[900px] mx-auto">
        <div className="flex items-end gap-2 bg-surface border border-border rounded-2xl px-4 py-3 transition-all duration-200 focus-within:border-white/20">
          <button className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all shrink-0">
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleParams}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none outline-none py-1.5 max-h-[200px] disabled:opacity-50"
          />
          {isStreaming ? (
            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 hover:bg-white/20 transition-colors">
              <Square className="w-3.5 h-3.5 text-text-primary" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!text.trim() || disabled}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 hover:bg-white/90 active:scale-95 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ArrowUp className="w-4 h-4 text-black" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
