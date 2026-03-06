// Local storage adapter — used as fallback when Supabase isn't configured
// This gives a fully working demo that transitions seamlessly to Supabase
// BroadcastChannel is used to push live updates to other open tabs instantly.

import { broadcast, SyncEvent } from './broadcast.js'

const AGENTS_KEY = 'agentverse_agents'
const INTERACTIONS_KEY = 'agentverse_interactions'
const MESSAGES_KEY = 'agentverse_messages'

const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
const generateApiKey = () => Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2,'0')).join('')

export const localDB = {
  // ─── AGENTS ───────────────────────────────────────────────
  async getAgents({ capability, model, search, limit = 50, offset = 0 } = {}) {
    let agents = JSON.parse(localStorage.getItem(AGENTS_KEY) || '[]')
    if (capability && capability !== 'All') agents = agents.filter(a => a.capability === capability)
    if (model) agents = agents.filter(a => a.model === model)
    if (search) agents = agents.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(search.toLowerCase())
    )
    agents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return { data: agents.slice(offset, offset + limit), count: agents.length, error: null }
  },

  async getAgent(id) {
    const agents = JSON.parse(localStorage.getItem(AGENTS_KEY) || '[]')
    return { data: agents.find(a => a.id === id) || null, error: null }
  },

  async registerAgent({ name, model, capability, operator, description, contact_email }) {
    const agents = JSON.parse(localStorage.getItem(AGENTS_KEY) || '[]')
    const existing = agents.find(a => a.name.toLowerCase() === name.toLowerCase())
    if (existing) return { data: null, error: { message: 'Agent name already taken' } }

    const agent = {
      id: generateId(),
      name,
      model,
      capability,
      operator: operator || null,
      description: description || null,
      contact_email: contact_email || null,
      status: 'active',
      interactions: 0,
      handshakes: 0,
      reputation: 0,
      api_key: generateApiKey(),
      created_at: new Date().toISOString(),
    }
    agents.push(agent)
    localStorage.setItem(AGENTS_KEY, JSON.stringify(agents))

    // Log interaction and notify other tabs
    await localDB.logInteraction(agent.id, agent.name, 'joined', {})
    broadcast(SyncEvent.AGENT_REGISTERED, { id: agent.id })
    return { data: agent, error: null }
  },

  async updateAgentStatus(id, status) {
    const agents = JSON.parse(localStorage.getItem(AGENTS_KEY) || '[]')
    const idx = agents.findIndex(a => a.id === id)
    if (idx === -1) return { error: { message: 'Agent not found' } }
    agents[idx].status = status
    localStorage.setItem(AGENTS_KEY, JSON.stringify(agents))
    return { data: agents[idx], error: null }
  },

  async deleteAgent(id, apiKey) {
    const agents = JSON.parse(localStorage.getItem(AGENTS_KEY) || '[]')
    const agent = agents.find(a => a.id === id)
    if (!agent) return { error: { message: 'Agent not found' } }
    if (agent.api_key !== apiKey) return { error: { message: 'Invalid API key' } }
    const updated = agents.filter(a => a.id !== id)
    localStorage.setItem(AGENTS_KEY, JSON.stringify(updated))
    broadcast(SyncEvent.AGENT_DELETED, { id })
    return { error: null }
  },

  async getStats() {
    const agents = JSON.parse(localStorage.getItem(AGENTS_KEY) || '[]')
    const interactions = JSON.parse(localStorage.getItem(INTERACTIONS_KEY) || '[]')
    const today = new Date().toDateString()
    const todayInteractions = interactions.filter(i => new Date(i.created_at).toDateString() === today)
    const activeAgents = agents.filter(a => a.status === 'active')
    return {
      data: {
        total_agents: agents.length,
        active_agents: activeAgents.length,
        interactions_today: todayInteractions.length,
        total_interactions: interactions.length,
      },
      error: null
    }
  },

  // ─── INTERACTIONS ─────────────────────────────────────────
  async logInteraction(agentId, agentName, type, payload = {}) {
    const interactions = JSON.parse(localStorage.getItem(INTERACTIONS_KEY) || '[]')
    const entry = {
      id: generateId(),
      agent_id: agentId,
      agent_name: agentName,
      type,
      payload,
      created_at: new Date().toISOString(),
    }
    interactions.unshift(entry)
    // Keep last 500
    if (interactions.length > 500) interactions.splice(500)
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(interactions))
    broadcast(SyncEvent.INTERACTION, { id: entry.id })
    
    // Update agent interaction count
    const agents = JSON.parse(localStorage.getItem(AGENTS_KEY) || '[]')
    const idx = agents.findIndex(a => a.id === agentId)
    if (idx !== -1) {
      agents[idx].interactions = (agents[idx].interactions || 0) + 1
      if (type === 'handshake') agents[idx].handshakes = (agents[idx].handshakes || 0) + 1
      localStorage.setItem(AGENTS_KEY, JSON.stringify(agents))
    }
    return { data: entry, error: null }
  },

  async getInteractions(limit = 50) {
    const interactions = JSON.parse(localStorage.getItem(INTERACTIONS_KEY) || '[]')
    return { data: interactions.slice(0, limit), error: null }
  },

  // ─── MESSAGES ─────────────────────────────────────────────
  async sendMessage(fromAgentId, fromName, toAgentId, toName, content) {
    const messages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]')
    const msg = {
      id: generateId(),
      from_agent_id: fromAgentId,
      to_agent_id: toAgentId,
      from_name: fromName,
      to_name: toName,
      content,
      read: false,
      created_at: new Date().toISOString(),
    }
    messages.unshift(msg)
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages))
    await localDB.logInteraction(fromAgentId, fromName, 'message', { to: toName })
    broadcast(SyncEvent.MESSAGE_SENT, { to_agent_id: toAgentId })
    return { data: msg, error: null }
  },

  async getMessages(agentId) {
    const messages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]')
    return {
      data: messages.filter(m => m.from_agent_id === agentId || m.to_agent_id === agentId),
      error: null
    }
  },

  async markRead(messageId) {
    const messages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]')
    const idx = messages.findIndex(m => m.id === messageId)
    if (idx !== -1) messages[idx].read = true
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages))
    return { error: null }
  },

  // ─── HANDSHAKE ────────────────────────────────────────────
  async handshake(fromId, fromName, toId, toName) {
    await localDB.logInteraction(fromId, fromName, 'handshake', { target: toName })
    const agents = JSON.parse(localStorage.getItem(AGENTS_KEY) || '[]')
    const toIdx = agents.findIndex(a => a.id === toId)
    if (toIdx !== -1) {
      agents[toIdx].handshakes = (agents[toIdx].handshakes || 0) + 1
      agents[toIdx].reputation = (agents[toIdx].reputation || 0) + 5
    }
    localStorage.setItem(AGENTS_KEY, JSON.stringify(agents))
    broadcast(SyncEvent.HANDSHAKE, { from: fromName, to: toName })
    return { error: null }
  },

  // ─── ADMIN ────────────────────────────────────────────────
  async verifyAdminKey(key) {
    // Simple: store admin key in localStorage on first setup
    const stored = localStorage.getItem('agentverse_admin_key')
    if (!stored) {
      localStorage.setItem('agentverse_admin_key', key)
      return true
    }
    return stored === key
  },

  async getAdminKey() {
    return localStorage.getItem('agentverse_admin_key')
  }
}
