import { Info } from 'lucide-react'

interface ParameterCardProps {
  name: string
  description: string
  value: number
  min: number
  max: number
  step: number
  decimals: number
  onChange: (value: number) => void
  learnMore?: string
}

export function ParameterCard({ name, description, value, min, max, step, decimals, onChange, learnMore }: ParameterCardProps) {
  return (
    <div className="p-3 rounded-lg bg-card border border-border">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-text-primary">{name}</span>
          {learnMore && (
            <span className="group relative">
              <Info className="w-3 h-3 text-text-muted cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-card border border-border text-[10px] text-text-secondary whitespace-normal w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-elevated">
                {learnMore}
              </div>
            </span>
          )}
        </div>
        <div className="px-2 py-0.5 rounded-md bg-surface border border-border text-xs font-medium text-text-primary tabular-nums">
          {value.toFixed(decimals)}
        </div>
      </div>
      <div className="text-[11px] text-text-muted mb-2">{description}</div>
      <div className="relative w-full h-6 flex items-center">
        <div className="absolute inset-0 rounded-full bg-[#2a2a2a] border border-[#505050] pointer-events-none" />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="relative w-full h-6 appearance-none bg-transparent cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20
            [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/20
            [&::-moz-range-track]:bg-transparent [&::-moz-range-track]:border-0"
          style={{
            WebkitAppearance: 'none',
            appearance: 'none',
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-muted mt-1">
        <span>{min.toFixed(decimals === 0 ? 0 : decimals)}</span>
        <span>{max.toFixed(decimals === 0 ? 0 : decimals)}</span>
      </div>
    </div>
  )
}
