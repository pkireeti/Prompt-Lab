import { motion } from 'framer-motion'

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-3 mb-6 max-w-[900px]"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-text-muted animate-pulse-soft" />
        </div>
        <span className="text-sm font-semibold text-text-primary">PromptLab</span>
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-text-muted animate-typing" style={{ animationDelay: '0s' }} />
          <span className="w-2 h-2 rounded-full bg-text-muted animate-typing" style={{ animationDelay: '0.2s' }} />
          <span className="w-2 h-2 rounded-full bg-text-muted animate-typing" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </motion.div>
  )
}
