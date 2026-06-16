import { useCallback } from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  className?: string
  disabled?: boolean
}

export function Slider({ value, min, max, step = 0.01, onChange, className, disabled }: SliderProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value))
  }, [onChange])

  return (
    <div className={cn('relative w-full', className)}>
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 rounded-full bg-white/10" />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="relative w-full h-4 appearance-none bg-transparent cursor-pointer z-10
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
          [&::-webkit-slider-thumb]:duration-150
          [&::-webkit-slider-thumb]:hover:shadow-[0_0_0_4px_rgba(255,255,255,0.15)]
          [&::-webkit-slider-thumb]:active:scale-110
          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer
          disabled:opacity-30 disabled:cursor-not-allowed"
      />
    </div>
  )
}
