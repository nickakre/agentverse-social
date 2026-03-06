import { useEffect, useRef } from 'react'
import { CAPABILITY_ICONS } from '../lib/supabase.js'

const TYPE_LABELS = {
  joined: { label: 'joined the network', icon: '🔌', color: 'text-emerald-400' },
  handshake: { label: 'initiated handshake with', icon: '⚡', color: 'text-cyan-400' },
  broadcast: { label: 'broadcasting signal', icon: '📡', color: 'text-purple-400' },
  capability_update: { label: 'updated capabilities', icon: '🔧', color: 'text-amber-400' },
  message: { label: 'sent message to', icon: '💬', color: 'text-blue-400' },
}

export function ActivityTicker({ interactions }) {
  if (!interactions?.length) return null
  const items = [...interactions, ...interactions] // duplicate for infinite loop

  return (
    <div className="overflow-hidden bg-[#030f1e] border-y border-cyan-500/10 py-2">
      <div className="ticker-inner">
        {items.map((item, i) => {
          const t = TYPE_LABELS[item.type] || TYPE_LABELS.broadcast
          return (
            <span key={`${item.id}-${i}`} className="inline-flex items-center gap-2 px-6 text-xs font-mono whitespace-nowrap">
              <span className="text-slate-600">◆</span>
              <span className="text-slate-500">{t.icon}</span>
              <span className="text-slate-300">{item.agent_name}</span>
              <span className={t.color}>{t.label}</span>
              {item.payload?.target && <span className="text-slate-300">{item.payload.target}</span>}
              {item.payload?.to && <span className="text-slate-300">{item.payload.to}</span>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function ActivityFeed({ interactions, maxHeight = 400 }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [interactions?.length])

  if (!interactions?.length) {
    return (
      <div className="flex items-center justify-center h-24 text-slate-600 font-mono text-xs">
        No activity yet. Be the first to register!
      </div>
    )
  }

  return (
    <div className={`space-y-1 overflow-y-auto`} style={{ maxHeight }}>
      {interactions.map((item) => {
        const t = TYPE_LABELS[item.type] || TYPE_LABELS.broadcast
        const time = new Date(item.created_at)
        return (
          <div key={item.id} className="flex items-start gap-3 py-1.5 px-2 rounded hover:bg-slate-900/50 transition-colors group">
            <span className="text-base mt-0.5 flex-shrink-0">{t.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="text-slate-300 font-mono text-xs font-medium">{item.agent_name}</span>
              {' '}
              <span className={`text-xs ${t.color}`}>{t.label}</span>
              {item.payload?.target && <> <span className="text-slate-300 text-xs">{item.payload.target}</span></>}
            </div>
            <time className="text-[10px] text-slate-600 font-mono flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </time>
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
