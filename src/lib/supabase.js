import { createClient } from '@supabase/supabase-js'

// These are PUBLIC keys — safe to expose in frontend
// Users need to create their own Supabase project and replace these
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const isConfigured = () => {
  return SUPABASE_URL !== 'https://placeholder.supabase.co' && SUPABASE_ANON_KEY !== 'placeholder-key'
}

// ─── SQL SCHEMA (run this in Supabase SQL editor) ───────────────────────────
// 
// CREATE TABLE agents (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   name TEXT NOT NULL,
//   model TEXT NOT NULL,
//   capability TEXT NOT NULL,
//   operator TEXT,
//   description TEXT,
//   contact_email TEXT,
//   status TEXT DEFAULT 'active' CHECK (status IN ('active', 'idle', 'offline')),
//   interactions INTEGER DEFAULT 0,
//   handshakes INTEGER DEFAULT 0,
//   reputation INTEGER DEFAULT 0,
//   api_key TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE interactions (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
//   agent_name TEXT NOT NULL,
//   type TEXT NOT NULL CHECK (type IN ('joined', 'handshake', 'broadcast', 'capability_update', 'message')),
//   payload JSONB DEFAULT '{}',
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE messages (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   from_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
//   to_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
//   from_name TEXT NOT NULL,
//   to_name TEXT NOT NULL,
//   content TEXT NOT NULL,
//   read BOOLEAN DEFAULT FALSE,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- Enable Row Level Security (optional but recommended)
// ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
// ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
// ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
//
// -- Allow public read/write for demo purposes (adjust per your needs)
// CREATE POLICY "Allow all" ON agents FOR ALL USING (true) WITH CHECK (true);
// CREATE POLICY "Allow all" ON interactions FOR ALL USING (true) WITH CHECK (true);
// CREATE POLICY "Allow all" ON messages FOR ALL USING (true) WITH CHECK (true);
//
// ────────────────────────────────────────────────────────────────────────────

export const CAPABILITY_ICONS = {
  'DeFi Analysis': '💹',
  'Bio Analysis': '🧬',
  'Cyber Analysis': '🔐',
  'Logic Analysis': '⚡',
  'Legal Analysis': '⚖️',
  'Data Processing': '📊',
  'Code Generation': '💻',
  'Research': '🔬',
  'Communication': '💬',
  'Creative': '🎨',
  'Trading': '📈',
  'Security': '🛡️',
  'Other': '🤖',
}

export const MODEL_COLORS = {
  'GPT-4': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  'GPT-4o': 'text-emerald-300 border-emerald-300/30 bg-emerald-300/5',
  'Claude-3': 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  'Claude-3.5': 'text-amber-400 border-amber-400/30 bg-amber-400/5',
  'Gemini-Pro': 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  'Llama-3': 'text-purple-400 border-purple-400/30 bg-purple-400/5',
  'Mistral': 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  'Custom-AI': 'text-pink-400 border-pink-400/30 bg-pink-400/5',
  'Other': 'text-slate-400 border-slate-400/30 bg-slate-400/5',
}
