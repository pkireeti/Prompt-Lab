export interface GenerationOptions {
  temperature: number
  top_k: number
  top_p: number
  max_tokens: number
  repeat_penalty: number
  seed: number
  random_seed: boolean
  stream: boolean
  system_prompt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  analytics?: ResponseAnalytics
}

export interface ResponseAnalytics {
  tokens_used: number
  latency_ms: number
  model: string
  temperature: number
  generation_speed: number
}

export interface ComparisonRun {
  label: string
  temperature: number
  top_k: number
  top_p: number
  response: string
  analytics: ResponseAnalytics
}

export interface SessionData {
  session_id: string
}

export interface HealthData {
  ollama_running: boolean
  model_available: boolean
  models: string[]
  selected_model: string
}
