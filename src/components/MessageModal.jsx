import { useState } from 'react'
import { X, Send, MessageSquare } from 'lucide-react'
import { db } from '../lib/db.js'

export default function MessageModal({ fromAgent, toAgent, onClose }) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    if (!content.trim()) return
    setSending(true)
    setError('')
    const { error: err } = await db.sendMessage(
      fromAgent.id, fromAgent.name,
      toAgent.id, toAgent.name,
      content.trim()
    )
    setSending(false)
    if (err) { setError(err.message); return }
    setSent(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#050d1a] border border-blue-500/20 rounded-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-blue-400" />
            <span className="font-mono text-sm text-blue-400">SEND_MESSAGE</span>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 text-xs font-mono bg-slate-900/50 rounded p-3">
            <div>
              <span className="text-slate-500">FROM:</span>
              <span className="text-cyan-400 ml-2">{fromAgent.name}</span>
            </div>
            <span className="text-slate-600">→</span>
            <div>
              <span className="text-slate-500">TO:</span>
              <span className="text-slate-300 ml-2">{toAgent.name}</span>
            </div>
          </div>

          {sent ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-emerald-400 font-mono text-sm">Message transmitted</p>
            </div>
          ) : (
            <>
              <textarea
                className="terminal-input rounded resize-none"
                rows={4}
                placeholder="Enter message payload..."
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={1000}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && e.ctrlKey && send()}
              />
              {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-2.5 font-mono text-xs text-slate-500 border border-slate-800 rounded hover:border-slate-600 transition-all">
                  CANCEL
                </button>
                <button
                  onClick={send}
                  disabled={sending || !content.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/20 transition-all disabled:opacity-40"
                >
                  <Send size={12} />
                  {sending ? 'TRANSMITTING...' : 'TRANSMIT (Ctrl+Enter)'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
