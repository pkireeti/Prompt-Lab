import type { HealthData, SessionData, GenerationOptions } from '@/types'

const BASE = '/api'

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  async createSession(): Promise<SessionData> {
    return fetchJSON<SessionData>(`${BASE}/session`)
  },

  async health(): Promise<HealthData> {
    return fetchJSON<HealthData>(`${BASE}/health`)
  },

  async listApiModels(apiKey: string, baseUrl?: string, mode?: string): Promise<string[]> {
    const data = await fetchJSON<{ models: string[] }>(`${BASE}/api-models`, {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey, base_url: baseUrl || 'https://api.openai.com/v1', mode: mode || 'nvidia' }),
    })
    return data.models
  },

  async getSettings(): Promise<Record<string, unknown>> {
    return fetchJSON<Record<string, unknown>>(`${BASE}/settings`)
  },

  async saveSettings(settings: Record<string, unknown>): Promise<void> {
    await fetchJSON(`${BASE}/settings`, {
      method: 'POST',
      body: JSON.stringify({ session_id: '', settings }),
    })
  },

  async sendMessage(
    sessionId: string,
    message: string,
    options: GenerationOptions,
    extras?: { apiKey?: string; useApi?: boolean; apiModel?: string; apiBaseUrl?: string; mode?: string },
  ) {
    const res = await fetch(`${BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        ...options,
        mode: extras?.mode || 'nvidia',
        api_key: extras?.apiKey || '',
        use_api: extras?.useApi || false,
        api_model: extras?.apiModel || 'gpt-4o-mini',
        api_base_url: extras?.apiBaseUrl || 'https://api.openai.com/v1',
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.detail || `Request failed: ${res.status}`)
    }
    return res
  },

  async listSessions(): Promise<{ sessions: { id: string; title: string; timestamp: string; messages: number; model: string }[] }> {
    return fetchJSON(`${BASE}/sessions`)
  },

  async deleteSession(sessionId: string): Promise<void> {
    await fetchJSON(`${BASE}/sessions/delete`, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    })
  },

  async exportSession(): Promise<{ path: string }> {
    return fetchJSON<{ path: string }>(`${BASE}/export`)
  },

  chartUrl(): string {
    return `${BASE}/chart`
  },
}
