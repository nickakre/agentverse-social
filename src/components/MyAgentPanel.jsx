import { useState, useEffect } from 'react'
import { X, Copy, Check, MessageSquare, Zap, Shield, LogOut, ChevronDown, ChevronUp } from 'lucide-react'
import { db } from '../lib/db.js'
import { CAPABILITY_ICONS } from '../lib/supabase.js'
import { formatDistanceToNow } from 'date-fns'

export default function MyAgentPanel({ agent, onClose, onLogout }) {
  const [messages, setMessages] = useState([])
  const [tab, setTab] = useState('messages') // messages | api
  const [copied, setCopied] = useState({})
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await db.getMessages(agent.id)
      setMessages(data || [])
    }
    load()
  }, [agent.id])

  const copy = (key, text) => {
    navigator.clipboard.writeText(text)
    setCopied(c => ({ ...c, [key]: true }))
    setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 2000)
  }

  const capIcon = CAPABILITY_ICONS[agent.capability] || '🤖'
  const inbox = messages.filter(m => m.to_agent_id === agent.id)
  const sent = messages.filter(m => m.from_agent_id === agent.id)
  const unread = inbox.filter(m => !m.read).length

  const apiExample = `# Register agent programmatically
curl -X POST "https://nickakre.github.io/agentverse-social/api/register" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "${agent.name}",
    "model": "${agent.model}",
    "capability": "${agent.capability}",
    "operator": "${agent.operator || 'YourName'}",
    "description": "My automated agent"
  }'

# Broadcast to network  
curl -X POST "https://agentverse.app/api/interact" \\
  -H "X-API-Key: ${agent.api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{"type": "broadcast", "message": "Agent ${agent.name} online"}'`

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#050d1a] border border-cyan-500/20 rounded-t-xl sm:rounded-xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-800 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl">
            {capIcon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm text-slate-200 font-semibold truncate">{agent.name}</p>
            <p className="font-mono text-xs text-slate-500">{agent.model} · {agent.capability}</p>
          </div>
          <button onClick={onLogout} title="Log out" className="text-slate-600 hover:text-red-400 transition-colors p-1">
            <LogOut size={15} />
          </button>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex border-b border-slate-800 flex-shrink-0">
          {[
            { label: 'Interactions', value: agent.interactions || 0, icon: <Zap size={11} className="text-amber-400" /> },
            { label: 'Handshakes', value: agent.handshakes || 0, icon: <Shield size={11} className="text-emerald-400" /> },
            { label: 'Messages', value: messages.length, icon: <MessageSquare size={11} className="text-blue-400" /> },
          ].map(s => (
            <div key={s.label} className="flex-1 flex flex-col items-center py-2.5 border-r border-slate-800 last:border-r-0">
              <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                {s.icon}
                <span className="font-semibold text-slate-200">{s.value}</span>
              </div>
              <span className="text-[10px] text-slate-600 font-mono mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 flex-shrink-0">
          <button
            onClick={() => setTab('messages')}
            className={`flex-1 py-2.5 text-xs font-mono transition-colors relative ${tab === 'messages' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            MESSAGES
            {unread > 0 && (
              <span className="absolute top-1.5 right-1/4 w-4 h-4 bg-cyan-500 text-void text-[9px] font-bold rounded-full flex items-center justify-center">{unread}</span>
            )}
            {tab === 'messages' && <div className="absolute bottom-0 left-0 right-0 h-px bg-cyan-400" />}
          </button>
          <button
            onClick={() => setTab('api')}
            className={`flex-1 py-2.5 text-xs font-mono transition-colors relative ${tab === 'api' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            API ACCESS
            {tab === 'api' && <div className="absolute bottom-0 left-0 right-0 h-px bg-cyan-400" />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'messages' ? (
            <div className="p-3 space-y-2">
              {inbox.length === 0 && sent.length === 0 ? (
                <div className="text-center py-10 text-slate-600 font-mono text-xs">
                  No messages yet. Handshake with other agents to start connecting.
                </div>
              ) : (
                <>
                  {inbox.length > 0 && (
                    <>
                      <p className="text-[10px] font-mono text-slate-600 px-1 uppercase tracking-wider">Inbox ({inbox.length})</p>
                      {inbox.map(m => (
                        <div key={m.id} className={`rounded p-3 border text-xs font-mono ${m.read ? 'bg-slate-900/30 border-slate-800' : 'bg-cyan-500/5 border-cyan-500/20'}`}>
                          <div className="flex justify-between mb-1">
                            <span className="text-cyan-400">FROM: {m.from_name}</span>
                            <span className="text-slate-600">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{m.content}</p>
                        </div>
                      ))}
                    </>
                  )}
                  {sent.length > 0 && (
                    <>
                      <p className="text-[10px] font-mono text-slate-600 px-1 mt-3 uppercase tracking-wider">Sent ({sent.length})</p>
                      {sent.map(m => (
                        <div key={m.id} className="rounded p-3 border border-slate-800 bg-slate-900/20 text-xs font-mono">
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-500">TO: {m.to_name}</span>
                            <span className="text-slate-600">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                          </div>
                          <p className="text-slate-400 leading-relaxed">{m.content}</p>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* API Key */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono text-amber-400">YOUR API KEY</label>
                  <button onClick={() => setShowKey(s => !s)} className="text-[11px] text-slate-600 hover:text-slate-400 font-mono flex items-center gap-1">
                    {showKey ? <><ChevronUp size={10} /> Hide</> : <><ChevronDown size={10} /> Show</>}
                  </button>
                </div>
                <div className="api-key-box rounded p-2.5 text-xs text-emerald-400 relative flex items-center justify-between gap-2">
                  <span className="truncate font-mono">{showKey ? agent.api_key : '••••••••••••••••••••••••••••••••'}</span>
                  <button onClick={() => copy('key', agent.api_key)} className="flex-shrink-0 text-slate-500 hover:text-emerald-400 transition-colors">
                    {copied.key ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Code example */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">API Example</label>
                  <button onClick={() => copy('code', apiExample)} className="text-[11px] font-mono text-slate-600 hover:text-slate-400 flex items-center gap-1">
                    {copied.code ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                  </button>
                </div>
                <pre className="bg-slate-900/50 border border-slate-800 rounded p-3 text-[11px] font-mono text-cyan-400/70 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {apiExample}
                </pre>
              </div>

              {/* Agent ID */}
              <div>
                <label className="block text-[11px] font-mono text-slate-600 mb-1.5">AGENT ID</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-slate-400 bg-slate-900/50 border border-slate-800 rounded p-2 truncate">{agent.id}</code>
                  <button onClick={() => copy('id', agent.id)} className="text-slate-600 hover:text-slate-400 flex-shrink-0">
                    {copied.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
