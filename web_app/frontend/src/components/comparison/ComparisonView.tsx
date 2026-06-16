import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, FlaskConical, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { ComparisonRun } from '@/types'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ComparisonViewProps {
  open: boolean
  onClose: () => void
  prompt: string
  onRunComparison: (temps: number[]) => Promise<ComparisonRun[]>
}

const TEMPERATURES = [
  { label: 'Precise', temp: 0.2, color: 'border-white/10 bg-white/[0.02]' },
  { label: 'Balanced', temp: 0.7, color: 'border-white/20 bg-white/[0.04]' },
  { label: 'Creative', temp: 1.2, color: 'border-white/10 bg-white/[0.02]' },
]

export function ComparisonView({ open, onClose, prompt, onRunComparison }: ComparisonViewProps) {
  const [runs, setRuns] = useState<ComparisonRun[]>([])
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    setLoading(true)
    try {
      const results = await onRunComparison(TEMPERATURES.map(t => t.temp))
      setRuns(results.map((r, i) => ({
        ...r,
        label: TEMPERATURES[i].label,
        temperature: TEMPERATURES[i].temp,
      })))
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
              Send a message first, then open comparison mode to see how different temperatures affect the response.
            </div>
          ) : (
            <>
              <div className="text-xs text-text-muted mb-4 px-3 py-2 bg-surface rounded-lg border border-border">
                Prompt: <span className="text-text-secondary">{prompt}</span>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleRun}
                disabled={loading}
                className="gap-2 mb-4"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
                {loading ? 'Running...' : 'Run Comparison'}
              </Button>

              {runs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {runs.map((run, i) => (
                    <div
                      key={i}
                      className={cn(
                        'rounded-xl border p-3',
                        TEMPERATURES[i].color,
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium text-text-primary px-2 py-0.5 rounded-full bg-white/[0.06] border border-border">{run.label}</span>
                        <span className="text-[11px] text-text-muted tabular-nums">
                          temp={run.temperature.toFixed(1)}
                        </span>
                      </div>
                      <Separator className="mb-2" />
                      <div className="text-xs text-text-secondary leading-relaxed max-h-[200px] overflow-y-auto prose prose-invert prose-xs max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {run.response || '(No response)'}
                        </ReactMarkdown>
                      </div>
                      {run.analytics && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                          <span className="text-[10px] text-text-muted">
                            {run.analytics.tokens_used} tok
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {run.analytics.latency_ms}ms
                          </span>
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
