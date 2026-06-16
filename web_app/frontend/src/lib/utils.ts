import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PREFERRED_API_MODELS = [
  'google/diffusiongemma-26b-a4b-it',
  'meta/llama-3.1-8b-instruct',
  'meta/llama-3.3-70b-instruct',
  'minimaxai/minimax-m3',
  'gpt-4o-mini',
  'gpt-4o',
]

export const DEFAULT_API_MODEL = 'google/diffusiongemma-26b-a4b-it'

const API_PROVIDERS: { patterns: RegExp[]; name: string; baseUrl: string }[] = [
  { patterns: [/^nvapi-/i, /nvapi/i], name: 'NVIDIA', baseUrl: 'https://integrate.api.nvidia.com/v1' },
  { patterns: [/^sk-/i, /sk-[a-z0-9]/i], name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
  { patterns: [/^gsk_/i], name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1' },
  { patterns: [/^pplx-/i], name: 'Perplexity', baseUrl: 'https://api.perplexity.ai' },
]

export function detectProvider(raw: string): { name: string; baseUrl: string } | null {
  const key = raw.replace(/[\u200b\u200c\u200d\ufeff]/g, '').trim()
  if (!key) return null
  for (const p of API_PROVIDERS) {
    for (const re of p.patterns) {
      if (re.test(key)) return { name: p.name, baseUrl: p.baseUrl }
    }
  }
  return null
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function formatTokens(count: number): string {
  if (count < 1000) return `${count} tokens`
  return `${(count / 1000).toFixed(1)}K tokens`
}

export function formatSpeed(tokens: number, ms: number): string {
  if (ms === 0) return '—'
  const tps = (tokens / (ms / 1000)).toFixed(0)
  return `${tps} tok/s`
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}
