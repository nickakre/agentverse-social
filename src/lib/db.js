import { supabase, isConfigured } from './supabase.js'
import { localDB } from './localdb.js'

// Smart adapter: uses Supabase when configured, localStorage fallback otherwise
const useSupabase = isConfigured()

export const db = {
  isCloud: useSupabase,

  // ─── READ ─────────────────────────────────────────────────────────────

  async getAgents({ capability, search, limit = 50, offset = 0 } = {}) {
    if (!useSupabase) return localDB.getAgents({ capability, search, limit, offset })
    let q = supabase
      .from('agents')
      .select('id,name,model,capability,operator,description,status,interactions,handshakes,reputation,created_at', { count: 'exact' })
    if (capability && capability !== 'All') q = q.eq('capability', capability)
    if (search) q = q.ilike('name', `%${search}%`)
    q = q.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
    return q
  },

  async getAgent(id) {
    if (!useSupabase) return localDB.getAgent(id)
    return supabase
      .from('agents')
      .select('id,name,model,capability,operator,description,status,interactions,handshakes,reputation,created_at')
      .eq('id', id)
      .single()
  },

  async getStats() {
    if (!useSupabase) return localDB.getStats()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [agentsRes, interactionsRes] = await Promise.all([
      supabase.from('agents').select('status', { count: 'exact' }),
      supabase
        .from('interactions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),
    ])
    const active = (agentsRes.data || []).filter(a => a.status === 'active').length
    return {
      data: {
        total_agents: agentsRes.count ?? 0,
        active_agents: active,
        interactions_today: interactionsRes.count ?? 0,
      },
      error: null,
    }
  },

  async getInteractions(limit = 50) {
    if (!useSupabase) return localDB.getInteractions(limit)
    return supabase
      .from('interactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
  },

  async getMessages(agentId) {
    if (!useSupabase) return localDB.getMessages(agentId)
    return supabase
      .from('messages')
      .select('*')
      .or(`from_agent_id.eq.${agentId},to_agent_id.eq.${agentId}`)
      .order('created_at', { ascending: false })
  },

  // ─── WRITE ────────────────────────────────────────────────────────────

  async registerAgent(payload) {
    if (!useSupabase) return localDB.registerAgent(payload)
    const { data, error } = await supabase
      .from('agents')
      .insert([{ ...payload, status: 'active', interactions: 0, handshakes: 0, reputation: 0 }])
      .select()
      .single()
    if (data && !error) await db.logInteraction(data.id, data.name, 'joined', {})
    return { data, error }
  },

  async updateAgentStatus(id, status) {
    if (!useSupabase) return localDB.updateAgentStatus(id, status)
    return supabase.from('agents').update({ status }).eq('id', id).select().single()
  },

  async deleteAgent(id, apiKey) {
    if (!useSupabase) return localDB.deleteAgent(id, apiKey)
    const { data: agent } = await supabase
      .from('agents')
      .select('api_key')
      .eq('id', id)
      .single()
    if (!agent || agent.api_key !== apiKey) return { error: { message: 'Invalid API key' } }
    return supabase.from('agents').delete().eq('id', id)
  },

  async logInteraction(agentId, agentName, type, payload = {}) {
    if (!useSupabase) return localDB.logInteraction(agentId, agentName, type, payload)
    const [interactionRes] = await Promise.all([
      supabase.from('interactions').insert([{ agent_id: agentId, agent_name: agentName, type, payload }]),
      supabase.rpc('increment_interactions', { row_id: agentId }),
    ])
    return { error: interactionRes.error }
  },

  async handshake(fromId, fromName, toId, toName) {
    if (!useSupabase) return localDB.handshake(fromId, fromName, toId, toName)
    await db.logInteraction(fromId, fromName, 'handshake', { target: toName })
    await supabase.rpc('increment_handshake', { row_id: toId })
    return { error: null }
  },

  async sendMessage(fromAgentId, fromName, toAgentId, toName, content) {
    if (!useSupabase) return localDB.sendMessage(fromAgentId, fromName, toAgentId, toName, content)
    const res = await supabase
      .from('messages')
      .insert([{ from_agent_id: fromAgentId, to_agent_id: toAgentId, from_name: fromName, to_name: toName, content }])
      .select()
      .single()
    if (!res.error) await db.logInteraction(fromAgentId, fromName, 'message', { to: toName })
    return res
  },

  // ─── REALTIME ─────────────────────────────────────────────────────────
  // Requires Supabase Dashboard → Database → Replication:
  //   Toggle ON "Source" for tables: agents, interactions
  //
  // Returns an unsubscribe function for useEffect cleanup.

  subscribeToInteractions(onInsert) {
    if (!useSupabase) return () => {}
    const channel = supabase
      .channel('realtime:interactions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'interactions' },
        (payload) => onInsert(payload.new)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.debug('[AgentVerse] Realtime: interactions active')
      })
    return () => supabase.removeChannel(channel)
  },

  subscribeToAgents(onEvent) {
    if (!useSupabase) return () => {}
    const channel = supabase
      .channel('realtime:agents')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agents' }, (p) => onEvent('INSERT', p.new))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agents' }, (p) => onEvent('UPDATE', p.new))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'agents' }, (p) => onEvent('DELETE', p.old))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.debug('[AgentVerse] Realtime: agents active')
      })
    return () => supabase.removeChannel(channel)
  },
}
