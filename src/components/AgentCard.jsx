import { useState } from 'react'
import { Zap, MessageSquare, Shield, Clock, Star, Cpu } from 'lucide-react'
import { CAPABILITY_ICONS, MODEL_COLORS } from '../lib/supabase.js'
import { db } from '../lib/db.js'
import { formatDistanceToNow } from 'date-fns'

const STATUS_STYLES = {
  active: 'bg-emerald-400',
  idle: 'bg-amber-400',
  offline: 'bg-slate-600',
}

export default function AgentCard({ agent, myAgent, onMessage, onHandshake, onSelect }) {
  const [handshaking, setHandshaking] = useState(false)
  const [handshaked, setHandshaked] = useState(false)
  const capIcon = CAPABILITY_ICONS[agent.capability] || '🤖'
  const modelStyle = MODEL_COLORS[agent.model] || MODEL_COLORS['Other']
  const isMe = myAgent?.id === agent.id
  const canInteract = myAgent && !isMe

  const handleHandshake = async (e) => {
    e.stopPropagation()
    if (!canInteract || handshaked || handshaking) return
    setHandshaking(true)
    await db.handshake(myAgent.id, myAgent.name, agent.id, agent.name)
    setHandshaked(true)
    setHandshaking(false)
    if (onHandshake) onHandshake(agent)
  }

  return (
    <div
      className="agent-card rounded-lg p-4 cursor-pointer relative overflow-hidden group"
      onClick={() => onSelect && onSelect(agent)}
    >
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan-500/20 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-cyan-500/10 rounded-bl-lg" />

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center text-xl">
              {capIcon}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${STATUS_STYLES[agent.status] || 'bg-slate-600'} border border-void ${agent.status === 'active' ? 'status-active' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-semibold text-slate-200 text-sm leading-tight">{agent.name}</h3>
              {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">YOU</span>}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{agent.capability}</p>
          </div>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded border font-mono ${modelStyle}`}>
          {agent.model}
        </span>
      </div>

      {/* Description */}
      {agent.description && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">
          {agent.description}
        </p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-3 text-xs text-slate-500 font-mono">
        <span className="flex items-center gap-1">
          <Zap size={10} className="text-amber-400" />
          {agent.interactions || 0}
        </span>
        <span className="flex items-center gap-1">
          <Shield size={10} className="text-emerald-400" />
          {agent.handshakes || 0}
        </span>
        <span className="flex items-center gap-1">
          <Star size={10} className="text-purple-400" />
          {agent.reputation || 0}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock size={9} className="text-slate-600" />
          {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Operator */}
      {agent.operator && (
        <p className="text-[11px] text-slate-600 font-mono mb-3 truncate">
          <span className="text-slate-700">op:</span> {agent.operator}
        </p>
      )}

      {/* Action buttons */}
      {canInteract && (
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={(e) => { e.stopPropagation(); onMessage && onMessage(agent) }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/30 rounded transition-all"
          >
            <MessageSquare size={11} />
            Message
          </button>
          <button
            onClick={handleHandshake}
            disabled={handshaked || handshaking}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-mono rounded transition-all border ${
              handshaked
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                : 'text-slate-400 hover:text-emerald-400 border-slate-800 hover:border-emerald-500/30'
            }`}
          >
            <Cpu size={11} />
            {handshaking ? '...' : handshaked ? 'Linked' : 'Handshake'}
          </button>
        </div>
      )}
    </div>
  )
}
