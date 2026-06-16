import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw, ChevronDown, FileText } from 'lucide-react'
import { ParameterCard } from './ParameterCard'
import type { GenerationOptions } from '@/types'

interface ParameterPanelProps {
  visible: boolean
  onToggle: () => void
  options: GenerationOptions
  onUpdate: <K extends keyof GenerationOptions>(key: K, value: GenerationOptions[K]) => void
}

const params = [
  { id: 'temperature' as const, name: 'Temperature', desc: 'Controls randomness in output', min: 0, max: 2, step: 0.01, decimals: 2, info: 'Temperature controls randomness. 0 = deterministic, 0.7 = balanced, 1.5+ = highly creative. Supported by all providers up to 2.0.' },
  { id: 'top_p' as const, name: 'Top-P', desc: 'Nucleus sampling cutoff', min: 0, max: 1, step: 0.01, decimals: 2, info: 'Top-P selects tokens whose cumulative probability reaches P. Supported by all providers. Lower = more focused.' },
  { id: 'top_k' as const, name: 'Top-K', desc: 'Limits token choices', min: 1, max: 100, step: 1, decimals: 0, info: 'Top-K limits to the K most likely next tokens. Only supported by Ollama. Not supported by OpenAI/Groq API.' },
  { id: 'max_tokens' as const, name: 'Max Tokens', desc: 'Maximum tokens to generate', min: 16, max: 4096, step: 1, decimals: 0, info: 'Max Tokens limits response length. Supported by all providers.' },
  { id: 'repeat_penalty' as const, name: 'Repeat Penalty', desc: 'Reduces repetition', min: 1, max: 2, step: 0.1, decimals: 1, info: 'Repeat Penalty discourages repeating tokens. Only supported by Ollama. OpenAI uses frequency_penalty instead.' },
  { id: 'seed' as const, name: 'Seed', desc: 'For reproducible results', min: 0, max: 999999, step: 1, decimals: 0, info: 'Seed sets the RNG state. Same seed + same params = same output. Supported by Ollama; some API providers may ignore it.' },
]

export function ParameterPanel({ visible, onToggle, options, onUpdate }: ParameterPanelProps) {
  const [systemExpanded, setSystemExpanded] = useState(false)

  const handleReset = () => {
    onUpdate('temperature', 0.7)
    onUpdate('top_p', 0.9)
    onUpdate('top_k', 40)
    onUpdate('max_tokens', 512)
    onUpdate('repeat_penalty', 1.1)
    onUpdate('seed', 42)
  }

  const getValue = (id: string) => {
    switch (id) {
      case 'temperature': return options.temperature
      case 'top_p': return options.top_p
      case 'top_k': return options.top_k
      case 'max_tokens': return options.max_tokens
      case 'repeat_penalty': return options.repeat_penalty
      case 'seed': return options.seed
      default: return 0
    }
  }

  return (
    <motion.aside
      animate={{ width: visible ? 280 : 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="relative h-full border-l border-border bg-background overflow-hidden flex-shrink-0"
    >
      <div className="w-[280px] h-full flex flex-col">
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <span className="text-sm font-semibold text-text-primary">Parameters</span>
          <div className="flex items-center gap-1">
            <button onClick={handleReset} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all" title="Reset">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={onToggle} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: 'thin' }}>
          {params.map(p => (
            <ParameterCard
              key={p.id}
              name={p.name}
              description={p.desc}
              value={getValue(p.id)}
              min={p.min}
              max={p.max}
              step={p.step}
              decimals={p.decimals}
              onChange={v => onUpdate(p.id, v)}
              learnMore={p.info}
            />
          ))}

          {/* System Prompt */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <button
              onClick={() => setSystemExpanded(!systemExpanded)}
              className="w-full flex items-center justify-between px-3 py-3 text-sm font-medium text-text-primary hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-text-muted" />
                System Prompt
              </div>
              <ChevronDown className={'w-4 h-4 text-text-muted transition-transform ' + (systemExpanded ? 'rotate-180' : '')} />
            </button>
            <AnimatePresence>
              {systemExpanded && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2">
                    <div className="flex gap-1.5 flex-wrap">
                      {['Teacher', 'Professor', 'Code'].map(p => (
                        <button
                          key={p}
                          onClick={() => {
                            const presets: Record<string, string> = {
                              Teacher: 'You are a friendly, patient teacher. Explain clearly and stay helpful and respectful.',
                              Professor: 'You are a formal university professor. Be precise and direct.',
                              Code: 'Answer ONLY programming and coding questions.',
                            }
                            onUpdate('system_prompt', presets[p])
                          }}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-surface border border-border text-text-muted hover:border-white/20 hover:text-text-primary transition-all"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={options.system_prompt}
                      onChange={e => onUpdate('system_prompt', e.target.value)}
                      rows={3}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-white/20 transition-colors"
                      placeholder="Set the behavior of the AI..."
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
