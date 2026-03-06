import { useState } from 'react'
import { X, Shield, Trash2, RefreshCw, Lock } from 'lucide-react'
import { db } from '../lib/db.js'
import { CAPABILITY_ICONS } from '../lib/supabase.js'
import { formatDistanceToNow } from 'date-fns'

// ── Admin auth ────────────────────────────────────────────────────────────
// The admin key is set via VITE_ADMIN_KEY_HASH in your .env / GitHub Secret.
// Generate your hash: https://emn178.github.io/online-tools/sha256.html
// Or run: echo -n "yourpassword" | sha256sum
//
// If the env var is missing, admin panel is disabled entirely — no one
// can claim it on a public deployment.
const ADMIN_HASH = import.meta.env.VITE_ADMIN_KEY_HASH || null

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function AdminPanel({ onClose }) {
  const [authed, setAuthed] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [keyError, setKeyError] = useState('')
  const [agents, setAgents] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const login = async () => {
    if (!ADMIN_HASH) {
      setKeyError('Admin panel is disabled. Set VITE_ADMIN_KEY_HASH in your environment.')
      return
    }
    if (!keyInput.trim()) { setKeyError('Enter admin key'); return }
    const hash = await sha256(keyInput.trim())
    if (hash === ADMIN_HASH) {
      setAuthed(true)
      loadData()
    } else {
      setKeyError('Invalid admin key')
    }
  }

  const loadData = async () => {
    setLoading(true)
    const [a, s] = await Promise.all([
      db.getAgents({ limit: 200 }),
      db.getStats(),
    ])
    setAgents(a.data || [])
    setStats(s.data)
    setLoading(false)
  }

  const deleteAgent = async (agent) => {
    const key = prompt(`Enter API key for "${agent.name}" to confirm deletion:`)
    if (!key) return
    setDeleting(agent.id)
    const { error } = await db.deleteAgent(agent.id, key)
    setDeleting(null)
    if (error) { alert(error.message); return }
    setAgents(prev => prev.filter(a => a.id !== agent.id))
  }

  const clearAll = async () => {
    if (!confirm('Delete ALL agents and interactions? This cannot be undone.')) return
    localStorage.removeItem('agentverse_agents')
    localStorage.removeItem('agentverse_interactions')
    localStorage.removeItem('agentverse_messages')
    loadData()
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#050d1a] border border-red-500/20 rounded-xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-red-400" />
            <span className="font-mono text-sm text-red-400">ADMIN_DASHBOARD</span>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300"><X size={18} /></button>
        </div>

        {!authed ? (
          <div className="p-6 space-y-4 max-w-xs mx-auto w-full">
            <div className="text-center">
              <Lock size={32} className={`mx-auto mb-3 ${ADMIN_HASH ? 'text-slate-600' : 'text-red-600'}`} />
              {ADMIN_HASH ? (
                <p className="text-xs text-slate-500 font-mono">Enter admin key to continue.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-400 font-mono">Admin panel is disabled.</p>
                  <p className="text-[11px] text-slate-600 font-mono">Set VITE_ADMIN_KEY_HASH in your .env / GitHub Secret to enable it.</p>
                  <pre className="text-[10px] text-slate-700 font-mono bg-slate-900 rounded p-2 mt-2 text-left">{`# Generate hash (run in terminal):
echo -n "yourpassword" | sha256sum

# Add to .env.local:
VITE_ADMIN_KEY_HASH=<hash>`}</pre>
                </div>
              )}
            </div>
            {ADMIN_HASH && (
              <>
                <input
                  type="password"
                  className="terminal-input rounded"
                  placeholder="Admin key..."
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && login()}
                  autoFocus
                />
                {keyError && <p className="text-red-400 text-xs font-mono">{keyError}</p>}
                <button onClick={login} className="w-full py-2.5 font-mono text-sm bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/20 transition-all">
                  AUTHENTICATE
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-4 gap-px bg-slate-800 border-b border-slate-800 flex-shrink-0">
                {[
                  { label: 'Total Agents', value: stats.total_agents },
                  { label: 'Active', value: stats.active_agents },
                  { label: 'Today', value: stats.interactions_today },
                  { label: 'All Interactions', value: stats.total_interactions },
                ].map(s => (
                  <div key={s.label} className="bg-[#050d1a] p-3 text-center">
                    <div className="font-display text-xl font-bold text-slate-100">{s.value}</div>
                    <div className="text-[10px] text-slate-600 font-mono">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="p-3 border-b border-slate-800 flex gap-2 flex-shrink-0">
              <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-400 border border-slate-700 rounded hover:border-slate-500 transition-all">
                <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-red-400 border border-red-500/20 rounded hover:bg-red-500/5 transition-all ml-auto">
                <Trash2 size={11} />
                Clear All Data
              </button>
            </div>

            {/* Agent table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-xs font-mono">
                <thead className="sticky top-0 bg-[#050d1a] border-b border-slate-800">
                  <tr>
                    <th className="text-left p-3 text-slate-600 font-normal">Agent</th>
                    <th className="text-left p-3 text-slate-600 font-normal">Model</th>
                    <th className="text-left p-3 text-slate-600 font-normal hidden sm:table-cell">Status</th>
                    <th className="text-right p-3 text-slate-600 font-normal">Joined</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map(agent => (
                    <tr key={agent.id} className="border-b border-slate-900 hover:bg-slate-900/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span>{CAPABILITY_ICONS[agent.capability] || '🤖'}</span>
                          <span className="text-slate-300">{agent.name}</span>
                        </div>
                        {agent.operator && <div className="text-slate-600 text-[10px] mt-0.5 pl-5">{agent.operator}</div>}
                      </td>
                      <td className="p-3 text-slate-500">{agent.model}</td>
                      <td className="p-3 hidden sm:table-cell">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${agent.status === 'active' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 text-right">
                        {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => deleteAgent(agent)}
                          disabled={deleting === agent.id}
                          className="text-slate-700 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {agents.length === 0 && (
                <div className="text-center py-10 text-slate-600 font-mono text-xs">No agents registered yet</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
