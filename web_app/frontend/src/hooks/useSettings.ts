import { useState, useCallback, useEffect } from 'react'
import type { GenerationOptions} from '@/types'
import { api } from '@/lib/api'

const DEFAULTS: GenerationOptions = {
  temperature: 0.7,
  top_k: 40,
  top_p: 0.9,
  max_tokens: 200,
  repeat_penalty: 1.1,
  seed: 42,
  random_seed: true,
  stream: true,
  system_prompt: 'You are a friendly, patient teacher. Explain clearly and stay helpful and respectful.',
}

export function useSettings() {
  const [options, setOptions] = useState<GenerationOptions>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api.getSettings().then(s => {
      if (s && Object.keys(s).length > 0) {
        setOptions(prev => ({
          ...prev,
          temperature: (s.temperature as number) ?? prev.temperature,
          top_k: (s.top_k as number) ?? prev.top_k,
          top_p: (s.top_p as number) ?? prev.top_p,
          max_tokens: (s.max_tokens as number) ?? prev.max_tokens,
          repeat_penalty: (s.repeat_penalty as number) ?? prev.repeat_penalty,
          seed: (s.seed as number) ?? prev.seed,
          random_seed: s.random_seed !== undefined ? (s.random_seed as boolean) : prev.random_seed,
          stream: s.stream !== undefined ? (s.stream as boolean) : prev.stream,
          system_prompt: (s.system_prompt as string) ?? prev.system_prompt,
        }))
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  const updateOption = useCallback(<K extends keyof GenerationOptions>(
    key: K,
    value: GenerationOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }, [])

  const getSettingsDict = useCallback(() => ({
    model_name: '',
    temperature: options.temperature,
    top_k: options.top_k,
    top_p: options.top_p,
    max_tokens: options.max_tokens,
    repeat_penalty: options.repeat_penalty,
    seed: options.seed,
    random_seed: options.random_seed,
    stream: options.stream,
    system_prompt: options.system_prompt,
  }), [options])

  return { options, updateOption, getSettingsDict, loaded }
}
