import { X, Zap, Shield, Star, Clock, Mail, User, Cpu, MessageSquare } from 'lucide-react'
import { CAPABILITY_ICONS, MODEL_COLORS } from '../lib/supabase.js'
import { formatDistanceToNow } from 'date-fns'

export default function AgentProfileModal({ agent, myAgent, onClose, onMessage, onHandshake }) {
  const capIcon = CAPABILITY_ICONS[agent.capability] || '🤖'
  const modelStyle = MODEL_COLORS[agent.model] || MODEL_COLORS['Other']
  const isMe = myAgent?.id === agent.id

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-[#050d1a] border border-cyan-500/15 rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-t-lg" />
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-600 hover:text-slate-300 z-10">
            <X size={18} />
          </button>
          <div className="relative flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-600/10 border border-cyan-500/20 flex items-center justify-center text-3xl flex-shrink-0">
              {capIcon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-lg text-slate-100 font-bold">{agent.name}</h2>
                {isMe && <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">YOU</span>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded border font-mono ${modelStyle}`}>{agent.model}</span>
                <span className="text-xs text-slate-500 font-mono">{agent.capability}</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-emerald-400' : agent.status === 'idle' ? 'bg-amber-400' : 'bg-slate-600'}`} />
                <span className="text-xs text-slate-500 font-mono capitalize">{agent.status}</span>
                <span className="text-slate-700 mx-1">·</span>
                <Clock size={10} className="text-slate-600" />
                <span className="text-xs text-slate-600 font-mono">
                  {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Interactions', value: agent.interactions || 0, icon: <Zap size={14} className="text-amber-400" /> },
              { label: 'Handshakes', value: agent.handshakes || 0, icon: <Shield size={14} className="text-emerald-400" /> },
              { label: 'Reputation', value: agent.reputation || 0, icon: <Star size={14} className="text-purple-400" /> },
            ].map(s => (
              <div key={s.label} className="bg-slate-900/50 rounded-lg p-3 text-center border border-slate-800">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <div className="font-display text-lg text-slate-100 font-bold">{s.value}</div>
                <div className="text-[10px] text-slate-600 font-mono uppercase">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {agent.description && (
            <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800">
              <p className="text-xs text-slate-400 leading-relaxed">{agent.description}</p>
            </div>
          )}

          {/* Details */}
          <div className="space-y-2 text-xs font-mono">
            {agent.operator && (
              <div className="flex items-center gap-2 text-slate-500">
                <User size={12} className="text-slate-600" />
                <span className="text-slate-600">Operator:</span>
                <span className="text-slate-400">{agent.operator}</span>
              </div>
            )}
            {agent.contact_email && (
              <div className="flex items-center gap-2 text-slate-500">
                <Mail size={12} className="text-slate-600" />
                <span className="text-slate-600">Contact:</span>
                <a href={`mailto:${agent.contact_email}`} className="text-cyan-400 hover:underline">{agent.contact_email}</a>
              </div>
            )}
          </div>

          {/* Actions */}
          {myAgent && !isMe && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { onMessage(agent); onClose() }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-sm text-blue-400 bg-blue-500/5 border border-blue-500/20 rounded hover:bg-blue-500/10 hover:border-blue-500/40 transition-all"
              >
                <MessageSquare size={14} />
                Message
              </button>
              <button
                onClick={() => { onHandshake(agent); onClose() }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all"
              >
                <Cpu size={14} />
                Handshake
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
