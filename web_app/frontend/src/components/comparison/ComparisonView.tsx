import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, FlaskConical, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { ComparisonRun } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface SlotConfig {
  label: string
  temperature: number
  top_k: number
  top_p: number
}

interface ComparisonViewProps {
  open: boolean
  onClose: () => void
  prompt: string
  onRunComparison: (slots: SlotConfig[], prompt: string) => Promise<ComparisonRun[]>
}

const DEFAULT_SLOTS: SlotConfig[] = [
  { label: 'Precise', temperature: 0.2, top_k: 10, top_p: 0.5 },
  { label: 'Balanced', temperature: 0.7, top_k: 40, top_p: 0.9 },
  { label: 'Creative', temperature: 1.2, top_k: 60, top_p: 0.95 },
]

export function ComparisonView({ open, onClose, prompt, onRunComparison }: ComparisonViewProps) {
  const [slots, setSlots] = useState<SlotConfig[]>(DEFAULT_SLOTS.map(s => ({ ...s })))
  const [runs, setRuns] = useState<ComparisonRun[]>([])
  const [loading, setLoading] = useState(false)

  const updateSlot = (i: number, key: keyof SlotConfig, value: number | string) => {
    setSlots(prev => prev.map((s, j) => j === i ? { ...s, [key]: value } : s))
  }

  const handleRun = async () => {
    setLoading(true)
    setRuns([])
    try {
      const results = await onRunComparison(slots, prompt)
      setRuns(results)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="mb-6 max-w-[900px] mx-auto"
    >
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-text-muted" />
              <span className="text-sm font-semibold text-text-primary">Response Comparison</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!prompt ? (
            <div className="text-center py-8 text-text-muted text-sm">
              Send a message first, then open comparison mode.
            </div>
          ) : (
            <>
              <div className="text-xs text-text-muted mb-4 px-3 py-2 bg-surface rounded-lg border border-border">
                Prompt: <span className="text-text-secondary">{prompt}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {slots.map((slot, i) => (
                  <div key={i} className="rounded-xl border border-border p-3 bg-card space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={slot.label}
                        onChange={e => updateSlot(i, 'label', e.target.value)}
                        className="flex-1 bg-transparent text-xs font-semibold text-text-primary border-b border-border px-1 py-0.5 focus:outline-none focus:border-white/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted">Temp</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={slot.temperature}
                          onChange={e => updateSlot(i, 'temperature', parseFloat(e.target.value))}
                          className="flex-1 h-1 accent-white"
                        />
                        <span className="text-[10px] text-text-muted w-6 text-right tabular-nums">{slot.temperature.toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted">Top-K</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max="100"
                          step="1"
                          value={slot.top_k}
                          onChange={e => updateSlot(i, 'top_k', parseInt(e.target.value))}
                          className="flex-1 h-1 accent-white"
                        />
                        <span className="text-[10px] text-text-muted w-6 text-right tabular-nums">{slot.top_k}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted">Top-P</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={slot.top_p}
                          onChange={e => updateSlot(i, 'top_p', parseFloat(e.target.value))}
                          className="flex-1 h-1 accent-white"
                        />
                        <span className="text-[10px] text-text-muted w-6 text-right tabular-nums">{slot.top_p.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleRun}
                disabled={loading}
                className="gap-2 mb-4"
              >
                <RefreshCw className={'w-3.5 h-3.5 ' + (loading ? 'animate-spin' : '')} />
                {loading ? 'Running...' : 'Run Comparison'}
              </Button>

              {runs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {runs.map((run, i) => (
                    <div key={i} className="rounded-xl border border-border p-3 bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium text-text-primary px-2 py-0.5 rounded-full bg-white/[0.06] border border-border">{run.label}</span>
                      </div>
                      <div className="text-[10px] text-text-muted mb-2 space-x-2">
                        <span>t={run.temperature.toFixed(1)}</span>
                        <span>k={run.top_k}</span>
                        <span>p={run.top_p.toFixed(2)}</span>
                      </div>
                      <Separator className="mb-2" />
                      <div className="text-xs text-text-secondary leading-relaxed max-h-[200px] overflow-y-auto prose prose-invert prose-xs max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {run.response || '(No response)'}
                        </ReactMarkdown>
                      </div>
                      {run.analytics && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                          <span className="text-[10px] text-text-muted">{run.analytics.tokens_used} tok</span>
                          <span className="text-[10px] text-text-muted">{run.analytics.latency_ms}ms</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}