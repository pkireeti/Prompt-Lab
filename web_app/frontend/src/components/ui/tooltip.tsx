import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const sideStyles: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={cn(
            'absolute z-50 px-2.5 py-1.5 text-xs font-normal leading-tight text-white bg-card border border-border rounded-lg shadow-elevated whitespace-normal max-w-[220px] animate-fade-in',
            sideStyles[side]
          )}
        >
          {content}
          <div
            className={cn(
              'absolute w-2 h-2 bg-card border-border rotate-45',
              side === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-0 border-l-0',
              side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-0 border-r-0',
            )}
          />
        </div>
      )}
    </div>
  )
}
