import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Upload, PanelLeftClose, SlidersHorizontal, Check } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { ParameterPanel } from '@/components/parameters/ParameterPanel'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { ChatInput } from '@/components/chat/ChatInput'
import { HeroSection } from '@/components/welcome/HeroSection'
import { DocsDialog } from '@/components/welcome/DocsDialog'
import { ComparisonView } from '@/components/comparison/ComparisonView'
import { TemplatesPanel } from '@/components/templates/TemplatesPanel'
import type { PromptTemplate } from '@/components/templates/TemplatesPanel'
import { api } from '@/lib/api'
import { detectProvider, PREFERRED_API_MODELS, DEFAULT_API_MODEL } from '@/lib/utils'
import { useChat } from '@/hooks/useChat'
import { useSettings } from '@/hooks/useSettings'
import type { ComparisonRun } from '@/types'

export default function App() {
  const [sessionId, setSessionId] = useState('')
  const [activeNav, setActiveNav] = useState('chat')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [paramsVisible, setParamsVisible] = useState(true)
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [showHero, setShowHero] = useState(true)
  const [showDocs, setShowDocs] = useState(false)
  const [localModels, setLocalModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiBaseUrl, setApiBaseUrl] = useState('https://api.openai.com/v1')
  const [useApi, setUseApi] = useState(true)
  const [apiModel, setApiModel] = useState(DEFAULT_API_MODEL)
  const [apiModels, setApiModels] = useState<string[]>([])
  const [apiConnected, setApiConnected] = useState(false)
  const [mode, setMode] = useState<'local' | 'api' | 'nvidia'>('nvidia')
  const [sessions, setSessions] = useState<{ id: string; title: string; timestamp: string; messages: number; model: string }[]>([])
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const modelDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const { options, updateOption } = useSettings()
  const { messages, isStreaming, streamingContent, sendMessage, clearMessages } = useChat(sessionId)

  const loadSessions = useCallback(async () => {
    try { const data = await api.listSessions(); setSessions(data.sessions) } catch {}
  }, [])

  useEffect(() => {
    api.health().then(h => {
      if (h.models?.length) { setLocalModels(h.models) }
    })
    api.createSession().then(s => {
      setSessionId(s.session_id)
      loadSessions()
    })
    setApiModel(DEFAULT_API_MODEL)
    setUseApi(true)
    setMode('nvidia')
    api.listApiModels('', 'https://integrate.api.nvidia.com/v1', 'nvidia').then(result => {
      if (result.length) {
        const sorted = [...result].sort((a, b) => {
          const ai = PREFERRED_API_MODELS.indexOf(a)
          const bi = PREFERRED_API_MODELS.indexOf(b)
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
        })
        setApiModels(sorted)
        if (sorted.length) setSelectedModel(sorted[0])
        setApiConnected(true)
      }
    }).catch(() => {})
  }, [loadSessions])

  const handleSelectSession = useCallback(async (id: string) => {
    setSessionId(id)
    clearMessages()
    setShowHero(false)
  }, [clearMessages])

  const handleDeleteSession = useCallback(async (id: string) => {
    await api.deleteSession(id)
    loadSessions()
    if (sessionId === id) {
      const s = await api.createSession()
      setSessionId(s.session_id)
      setShowHero(true)
    }
  }, [sessionId, loadSessions])

  const handleApiKeyChange = useCallback(async (raw: string) => {
    const key = raw.replace(/[\u200b\u200c\u200d\ufeff]/g, '').trim()
    setApiKey(key)
    setApiConnected(false)
    setUseApi(false)
    setApiModels([])
    if (!key || key.length < 20) return
    setMode('api')
    const provider = detectProvider(key)
    const baseUrl = provider?.baseUrl || 'https://api.openai.com/v1'
    if (provider) setApiBaseUrl(baseUrl)
    try {
      const result = await api.listApiModels(key, baseUrl)
      if (result.length) {
        const sorted = [...result].sort((a, b) => {
          const ai = PREFERRED_API_MODELS.indexOf(a)
          const bi = PREFERRED_API_MODELS.indexOf(b)
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
        })
        setApiModels(sorted)
        setApiModel(sorted[0])
        setSelectedModel(sorted[0])
        setUseApi(true)
        setApiConnected(true)
      }
    } catch {}
  }, [])

  const handleSetMode = useCallback((newMode: 'local' | 'api' | 'nvidia') => {
    setMode(newMode)
    if (newMode === 'local') {
      setUseApi(false)
      setApiConnected(false)
      if (localModels.length) setSelectedModel(localModels[0])
    } else if (newMode === 'nvidia') {
      setUseApi(true)
      setApiConnected(true)
      setApiModel(DEFAULT_API_MODEL)
      setSelectedModel(DEFAULT_API_MODEL)
      if (!apiModels.length) {
        api.listApiModels('', 'https://integrate.api.nvidia.com/v1', 'nvidia').then(result => {
          if (result.length) {
            const sorted = [...result].sort((a, b) => {
              const ai = PREFERRED_API_MODELS.indexOf(a)
              const bi = PREFERRED_API_MODELS.indexOf(b)
              return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
            })
            setApiModels(sorted)
          }
        }).catch(() => {})
      }
    } else {
      setUseApi(true)
      setApiConnected(false)
      if (apiKey && apiKey.length >= 20) {
        api.listApiModels(apiKey, apiBaseUrl).then(result => {
          if (result.length) {
            const sorted = [...result].sort((a, b) => {
              const ai = PREFERRED_API_MODELS.indexOf(a)
              const bi = PREFERRED_API_MODELS.indexOf(b)
              return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
            })
            setApiModels(sorted)
            setApiModel(sorted[0])
            setSelectedModel(sorted[0])
            setApiConnected(true)
          }
        }).catch(() => {})
      }
    }
  }, [localModels, apiModels, apiKey, apiBaseUrl])

  const handleApiDisconnect = useCallback(() => {
    setApiKey('')
    setApiConnected(false)
    setUseApi(false)
    setApiModels([])
    setMode('local')
    if (localModels.length) setSelectedModel(localModels[0])
  }, [localModels])

  const handleModelChange = useCallback((model: string) => {
    if (useApi) {
      setApiModel(model)
    }
    setSelectedModel(model)
    clearMessages()
    setShowHero(true)
    api.createSession().then(s => setSessionId(s.session_id))
  }, [useApi, clearMessages])

  const handleSend = useCallback((text: string) => {
    setShowHero(false)
    sendMessage(text, options, {
      mode,
      apiKey: mode === 'api' ? apiKey : '',
      useApi: mode !== 'local',
      apiModel,
      apiBaseUrl,
    })
    setTimeout(loadSessions, 500)
  }, [sendMessage, options, mode, apiKey, apiModel, loadSessions])

  const handleUseTemplate = useCallback((t: PromptTemplate) => {
    updateOption('system_prompt', t.systemPrompt)
    setActiveNav('chat')
    setShowHero(false)
    setTimeout(() => sendMessage(t.starterMessage, options, {
      mode,
      apiKey: mode === 'api' ? apiKey : '',
      useApi: mode !== 'local',
      apiModel,
      apiBaseUrl,
    }), 100)
  }, [updateOption, sendMessage, options, mode, apiKey, apiModel, apiBaseUrl])

  const handleNewSession = useCallback(async () => {
    clearMessages()
    setShowHero(true)
    setComparisonOpen(false)
    const s = await api.createSession()
    setSessionId(s.session_id)
  }, [clearMessages])

  const handleExport = useCallback(async () => {
    try {
      const data = await api.exportSession()
      alert('Session exported: ' + data.path)
    } catch (err: any) { alert(err.message) }
  }, [])

  const handleStartExperiment = useCallback(() => {
    setShowHero(false)
    api.createSession().then(s => { setSessionId(s.session_id); clearMessages() })
  }, [clearMessages])

  const handleRunComparison = useCallback(async (slots: { label: string; temperature: number; top_k: number; top_p: number }[], prompt?: string): Promise<ComparisonRun[]> => {
    const lastPrompt = prompt || messages.filter(m => m.role === 'user').pop()?.content || ''
    const results: ComparisonRun[] = []
    for (const slot of slots) {
      const opts = { ...options, temperature: slot.temperature, top_k: slot.top_k, top_p: slot.top_p, stream: false }
      try {
        const res = await api.sendMessage(
          sessionId,
          lastPrompt,
          opts,
          { mode, apiKey: mode === 'api' ? apiKey : '', useApi: mode !== 'local', apiModel, apiBaseUrl },
        )
        const data = await res.json()
        results.push({
          label: slot.label,
          temperature: slot.temperature,
          top_k: slot.top_k,
          top_p: slot.top_p,
          response: data.reply || '(no response)',
          analytics: {
            tokens_used: (data.reply || '').split(/\s+/).filter(Boolean).length,
            latency_ms: 0,
            model: useApi ? apiModel : 'local',
            temperature: slot.temperature,
            generation_speed: 0,
          },
        })
      } catch {
        results.push({
          label: slot.label, temperature: slot.temperature, top_k: slot.top_k, top_p: slot.top_p,
          response: 'Error',
          analytics: { tokens_used: 0, latency_ms: 0, model: 'local', temperature: slot.temperature, generation_speed: 0 },
        })
      }
    }
    return results
  }, [sessionId, options, mode, apiKey, apiModel, messages])

  const currentModels = useApi ? apiModels : localModels

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNewSession={handleNewSession}
        onOpenDocs={() => setShowDocs(true)}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        apiKey={apiKey}
        apiBaseUrl={apiBaseUrl}
        useApi={useApi}
        apiModel={apiModel}
        apiConnected={apiConnected}
        onApiKeyChange={handleApiKeyChange}
        onApiBaseUrlChange={setApiBaseUrl}
        onApiDisconnect={handleApiDisconnect}
        onApiModelChange={setApiModel}
        apiModels={apiModels}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 border-b border-border bg-background gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => setSidebarCollapsed(false)} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors shrink-0">
              <PanelLeftClose className="w-4 h-4 rotate-180" />
            </button>
            <div className="relative" ref={modelDropdownRef}>
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-text-primary hover:bg-white/[0.04] transition-all"
              >
                <span className="max-w-[160px] truncate">{selectedModel || 'Select model'}</span>
                <ChevronDown className={'w-3.5 h-3.5 text-text-muted transition-transform ' + (modelDropdownOpen ? 'rotate-180' : '')} />
              </button>
              <AnimatePresence>
                {modelDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute top-full mt-1.5 left-0 w-72 max-h-64 overflow-y-auto bg-surface border border-border rounded-xl shadow-xl z-50 py-1"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {currentModels.length === 0 ? (
                      <div className="px-3 py-4 text-xs text-text-muted text-center">No models available</div>
                    ) : currentModels.map(m => (
                      <button
                        key={m}
                        onClick={() => { handleModelChange(m); setModelDropdownOpen(false) }}
                        className={'w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ' + (m === selectedModel ? 'bg-white/[0.06] text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.02]')}
                      >
                        <span className={'w-4 h-4 flex items-center justify-center ' + (m === selectedModel ? 'text-text-primary' : 'text-transparent')}>
                          {m === selectedModel && <Check className="w-3.5 h-3.5" />}
                        </span>
                        <span className="truncate">{m}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-1 px-1 py-0.5 rounded-full border border-border bg-card shrink-0">
              <button onClick={() => handleSetMode('local')} className={'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium transition-all ' + (mode === 'local' ? 'bg-white text-black' : 'text-text-muted hover:text-text-secondary')}>L</button>
              <button onClick={() => handleSetMode('nvidia')} className={'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium transition-all ' + (mode === 'nvidia' ? 'bg-white text-black' : 'text-text-muted hover:text-text-secondary')}>N</button>
              <button onClick={() => { if (apiKey && apiKey.length >= 20) handleSetMode('api') }} className={'px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium transition-all ' + (mode === 'api' ? 'bg-white text-black' : 'text-text-muted hover:text-text-secondary')}>API</button>
            </div>
            <span className="hidden sm:block text-[11px] text-text-muted truncate max-w-[80px] lg:max-w-[160px]">{selectedModel || ''}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setParamsVisible(!paramsVisible)}
              className={'p-1.5 rounded-md text-sm transition-all ' + (paramsVisible ? 'bg-white/[0.06] text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-white/[0.04]')}
              title="Toggle parameters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            {!showHero && messages.length > 0 && (
              <button
                onClick={() => setComparisonOpen(!comparisonOpen)}
                className={'px-3 py-1.5 rounded-md text-sm font-medium transition-all ' + (comparisonOpen ? 'bg-white/10 text-text-primary' : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.04]')}
              >
                Compare
              </button>
            )}
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all">
              <Upload className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {activeNav === 'models' ? (
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Available Models</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-medium text-text-primary mb-2">Local (Ollama)</h3>
                <div className="space-y-1.5">
                  {localModels.length === 0 ? (
                    <p className="text-xs text-text-muted">No local models found</p>
                  ) : localModels.map(m => (
                    <div key={m} className={'flex items-center justify-between px-3 py-2 rounded-lg text-xs border ' + (m === selectedModel && !useApi ? 'bg-white/[0.06] border-white/20 text-text-primary' : 'border-transparent text-text-secondary')}>
                      <span>{m}</span>
                      <span className="text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border">local</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-medium text-text-primary mb-2">
                  {mode === 'nvidia' ? 'NVIDIA Cloud' : mode === 'api' ? 'API' : 'NVIDIA Cloud'}
                </h3>
                <div className="space-y-1.5">
                  {apiModels.length === 0 ? (
                    <p className="text-xs text-text-muted">No API models available</p>
                  ) : apiModels.map(m => (
                    <div key={m} className={'flex items-center justify-between px-3 py-2 rounded-lg text-xs border ' + (m === selectedModel && useApi ? 'bg-white/[0.06] border-white/20 text-text-primary' : 'border-transparent text-text-secondary')}>
                      <span className="truncate">{m}</span>
                      <span className="text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border shrink-0 ml-2">{mode}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : activeNav === 'templates' ? (
          <TemplatesPanel onUseTemplate={handleUseTemplate} />
        ) : showHero ? (
          <HeroSection onStartExperiment={handleStartExperiment} onOpenDocs={() => setShowDocs(true)} />
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <ChatPanel messages={messages} isStreaming={isStreaming} streamingContent={streamingContent} />
            <div className="px-4">
              <AnimatePresence>
                <ComparisonView
                  open={comparisonOpen}
                  onClose={() => setComparisonOpen(false)}
                  prompt={messages.filter(m => m.role === 'user').pop()?.content || ''}
                  onRunComparison={handleRunComparison}
                />
              </AnimatePresence>
            </div>
            <ChatInput
              onSend={handleSend}
              disabled={!sessionId}
              isStreaming={isStreaming}
              onToggleParams={() => setParamsVisible(!paramsVisible)}
            />
          </div>
        )}
      </div>

      <ParameterPanel
        visible={paramsVisible}
        onToggle={() => setParamsVisible(!paramsVisible)}
        options={options}
        onUpdate={updateOption}
      />

      <DocsDialog open={showDocs} onClose={() => setShowDocs(false)} />
    </div>
  )
}
