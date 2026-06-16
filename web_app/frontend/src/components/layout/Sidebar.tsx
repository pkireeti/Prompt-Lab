import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PanelLeftClose, MessageSquare, Compass, HelpCircle, Plus,
  ChevronDown, ChevronRight, FileText,
  Key, Globe, ChevronUp,
} from 'lucide-react'
import { cn, detectProvider } from '@/lib/utils'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onNewSession: () => void
  onOpenDocs: () => void
  activeNav: string
  onNavChange: (nav: string) => void
  apiKey: string
  apiBaseUrl: string
  useApi: boolean
  apiModel: string
  apiConnected: boolean
  onApiKeyChange: (key: string) => void
  onApiBaseUrlChange: (url: string) => void
  onApiDisconnect: () => void
  onApiModelChange: (model: string) => void
  apiModels: string[]

}

export function Sidebar({
  collapsed, onToggle, onNewSession, onOpenDocs,
  activeNav, onNavChange,
  apiKey, apiBaseUrl, useApi, apiModel, apiConnected,
  onApiKeyChange, onApiBaseUrlChange, onApiDisconnect, onApiModelChange, apiModels,
}: SidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ explore: true, apiSettings: false })
  const [showApiKey, setShowApiKey] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const detected = useMemo(() => detectProvider(apiKey), [apiKey])

  return (
    <motion.aside
      animate={{ width: collapsed ? 0 : 280 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="relative h-full bg-background border-r border-border overflow-hidden flex-shrink-0"
    >
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-[280px] h-full flex flex-col"
          >
            {/* Top bar with logo */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border">
              <img src="/logo.svg" alt="PromptLab" className="h-8" />
              <button onClick={onToggle} className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors">
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* New Session */}
            <div className="px-3 pt-3 pb-2">
              <button onClick={onNewSession} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-card border border-border text-sm text-text-primary hover:bg-white/[0.02] transition-all">
                <span className="flex items-center gap-2"><Plus className="w-4 h-4" />New Session</span>
                <span className="text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border leading-none">⌘K</span>
              </button>
            </div>

            {/* Navigation */}
            <div className="px-2 space-y-0.5">
              <button
                onClick={() => onNavChange('chat')}
                className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all', activeNav === 'chat' ? 'bg-white/[0.06] text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.02]')}
              >
                <MessageSquare className="w-4 h-4" /> Chat
              </button>
              <button
                onClick={() => onNavChange('models')}
                className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all', activeNav === 'models' ? 'bg-white/[0.06] text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.02]')}
              >
                <Compass className="w-4 h-4" /> Models
              </button>
              <button
                onClick={() => onNavChange('templates')}
                className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all', activeNav === 'templates' ? 'bg-white/[0.06] text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.02]')}
              >
                <FileText className="w-4 h-4" /> Prompt Templates
              </button>
            </div>

            {/* API Settings */}
            <div className="mt-2 px-2">
              <button
                onClick={() => setExpanded(p => ({ ...p, apiSettings: !p.apiSettings }))}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted uppercase tracking-wider w-full"
              >
                <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', expanded.apiSettings && 'rotate-90')} />
                <Key className="w-3.5 h-3.5" /> API
              </button>
              <AnimatePresence>
                {expanded.apiSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-2 pt-2"
                  >
                    <div className="px-1 space-y-2">
                      <div>
                        <label className="text-[10px] text-text-muted block mb-1">API Key</label>
                        <div className="relative">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={e => onApiKeyChange(e.target.value)}
                            placeholder="Paste your API key to connect..."
                            className="w-full bg-surface border border-border rounded-md px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-white/20 transition-colors pr-8 font-mono"
                          />
                          <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-[10px]"
                          >
                            {showApiKey ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                      {apiKey && !apiConnected && detected && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] border border-border">
                          <Globe className="w-3 h-3 text-text-muted" />
                          <span className="text-xs text-text-secondary">Detected: {detected.name}</span>
                        </div>
                      )}
                      {apiKey && !apiConnected && apiKey.length >= 20 && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface border border-border">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="text-xs text-text-muted">Connecting...</span>
                        </div>
                      )}
                      {apiConnected && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span className="text-xs text-blue-400 font-medium">{detected?.name || 'API'} · Connected</span>
                            </div>
                            <button
                              onClick={onApiDisconnect}
                              className="px-2.5 py-1.5 rounded-md text-xs font-medium text-text-muted border border-border hover:text-text-primary hover:border-white/20 transition-all"
                            >
                              Disconnect
                            </button>
                          </div>
                          <div>
                            <label className="text-[10px] text-text-muted block mb-1">Model</label>
                            <select
                              value={apiModel}
                              onChange={e => onApiModelChange(e.target.value)}
                              className="w-full bg-surface border border-border rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-white/20 transition-colors appearance-none"
                            >
                              {apiModels.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-primary transition-colors"
                          >
                            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            Advanced
                          </button>
                          {showAdvanced && (
                            <div>
                              <label className="text-[10px] text-text-muted block mb-1">Base URL</label>
                              <input
                                type="text"
                                value={apiBaseUrl}
                                onChange={e => onApiBaseUrlChange(e.target.value)}
                                placeholder="https://api.openai.com/v1"
                                className="w-full bg-surface border border-border rounded-md px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-white/20 transition-colors font-mono"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1" />
            {/* Bottom: Help & Docs */}
            <div className="border-t border-border py-1 px-2">
              <button onClick={onOpenDocs} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.02] transition-all"><HelpCircle className="w-4 h-4" /> Help & Docs</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
