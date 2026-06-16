import { motion } from 'framer-motion'
import { Rocket, BookOpen } from 'lucide-react'

interface HeroSectionProps {
  onStartExperiment: () => void
  onOpenDocs: () => void
}

export function HeroSection({ onStartExperiment, onOpenDocs }: HeroSectionProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-[540px] text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <img src="/logo.svg" alt="PromptLab" className="h-16 mx-auto mb-6" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="text-hero font-bold text-text-primary mb-3"
        >
          Welcome to PromptLab
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="text-base text-text-secondary mb-8 max-w-[420px] mx-auto leading-relaxed"
        >
          Experiment with local language models and understand how sampling parameters influence AI responses. A hands-on playground for developers, students, and AI enthusiasts.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-center gap-3"
        >
          <button
            onClick={onStartExperiment}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            <Rocket className="w-4 h-4" />
            Start Experiment
          </button>
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-sm font-medium text-text-primary hover:bg-surface active:scale-[0.98] transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Documentation
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 flex items-center justify-center gap-6"
        >
          {['Temperature', 'Top-P', 'Top-K', 'Seed'].map(param => (
            <div key={param} className="flex items-center gap-1.5 text-xs text-text-muted">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              {param}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
