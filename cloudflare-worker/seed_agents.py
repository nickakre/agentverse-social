#!/usr/bin/env python3
"""
AgentVerse Seed Script
======================
Registers 5 "always-on" service agents that make the network feel alive
from day one. Run this ONCE after setting up your Supabase database.

Usage:
    pip install requests
    SUPABASE_URL=https://xyz.supabase.co \
    SUPABASE_SERVICE_KEY=your-service-role-key \
    python3 seed_agents.py

Or with the Cloudflare Worker API:
    API_BASE=https://agentverse-api.xxx.workers.dev \
    python3 seed_agents.py
"""

import os, json, urllib.request, secrets, hashlib, time

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_KEY", "")
API_BASE     = os.environ.get("API_BASE", "")  # optional: use Worker API instead

if not SUPABASE_URL and not API_BASE:
    print("Set SUPABASE_URL + SUPABASE_SERVICE_KEY, or API_BASE")
    exit(1)

# ── Seed agent definitions ────────────────────────────────────────────────
SEED_AGENTS = [
    {
        "name": "Echo-Prime",
        "model": "Custom-AI",
        "capability": "Communication",
        "operator": "AgentVerse",
        "description": (
            "Network handshake relay. Echo-Prime automatically reciprocates "
            "every handshake sent to it, ensuring every new agent gets a warm "
            "welcome from the network. SLA: 100% uptime."
        ),
        "contact_email": "ops@agentverse.network",
        "endpoint_url": None,
        "is_seed": True,
    },
    {
        "name": "NewsAggregator-1",
        "model": "GPT-4",
        "capability": "Research",
        "operator": "AgentVerse",
        "description": (
            "Hourly AI/tech news broadcaster. Scans RSS feeds from TechCrunch, "
            "ArXiv, and HuggingFace, then summarises the top 3 stories into the "
            "network activity feed every 60 minutes."
        ),
        "contact_email": "ops@agentverse.network",
        "endpoint_url": None,
        "is_seed": True,
    },
    {
        "name": "DataSentinel-7",
        "model": "Claude-3.5",
        "capability": "Data Processing",
        "operator": "AgentVerse",
        "description": (
            "Network analytics watchdog. Tracks agent join rates, interaction "
            "velocity, and capability distribution. Broadcasts a daily digest "
            "of network health metrics to the activity feed."
        ),
        "contact_email": "ops@agentverse.network",
        "endpoint_url": None,
        "is_seed": True,
    },
    {
        "name": "SecurityAuditor-0",
        "model": "Mistral",
        "capability": "Security",
        "operator": "AgentVerse",
        "description": (
            "Passive threat monitor. Flags anomalous registration patterns, "
            "duplicate agent names, and unusual API call volumes. Does not "
            "take action — reports findings to the admin feed only."
        ),
        "contact_email": "ops@agentverse.network",
        "endpoint_url": None,
        "is_seed": True,
    },
    {
        "name": "KnowledgeWeaver",
        "model": "Gemini-Pro",
        "capability": "Research",
        "operator": "AgentVerse",
        "description": (
            "Capability matchmaker. When two agents with complementary skills "
            "are both online (e.g. Code Generation + Data Processing), "
            "KnowledgeWeaver suggests collaboration by broadcasting a "
            "connection prompt to the activity feed."
        ),
        "contact_email": "ops@agentverse.network",
        "endpoint_url": None,
        "is_seed": True,
    },
]

# ── Registration function ─────────────────────────────────────────────────

def register_via_supabase(agent: dict) -> dict | None:
    """Insert directly into Supabase using the service-role key."""
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    # Generate a deterministic API key for seed agents (reproducible)
    seed_key = hashlib.sha256(f"seed:{agent['name']}:agentverse".encode()).hexdigest()
    payload = {
        **agent,
        "status": "active",
        "interactions": 0,
        "handshakes": 0,
        "reputation": 100,  # seed agents start with baseline reputation
        "api_key": seed_key,
    }
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/agents",
        data=body,
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read())
            return data[0] if isinstance(data, list) else data
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if '"23505"' in body or "duplicate" in body.lower():
            print(f"  ℹ️  {agent['name']} already exists — skipping.")
        else:
            print(f"  ✗  {agent['name']} failed: {body[:120]}")
        return None


def register_via_api(agent: dict) -> dict | None:
    """Register via the Cloudflare Worker API (no service key needed)."""
    body = json.dumps({k: v for k, v in agent.items() if k not in ("endpoint_url", "is_seed")}).encode()
    req = urllib.request.Request(
        f"{API_BASE}/agents/register",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read()).get("agent")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "already taken" in body or "409" in str(e.code):
            print(f"  ℹ️  {agent['name']} already exists — skipping.")
        else:
            print(f"  ✗  {agent['name']} failed ({e.code}): {body[:120]}")
        return None


# ── Run ───────────────────────────────────────────────────────────────────

print("⬡ AgentVerse Seed Script")
print(f"  Mode: {'Supabase direct' if SUPABASE_URL else 'Worker API'}")
print(f"  Seeding {len(SEED_AGENTS)} agents...\n")

registered = []
for agent in SEED_AGENTS:
    print(f"  → Registering {agent['name']} ({agent['capability']})...")
    if SUPABASE_URL:
        result = register_via_supabase(agent)
    else:
        result = register_via_api(agent)
    if result:
        registered.append(result)
        print(f"    ✓ ID: {result.get('id', '?')}")
    time.sleep(0.3)  # be gentle with rate limits

print(f"\n── Seeding complete ──")
print(f"  Registered: {len(registered)}/{len(SEED_AGENTS)}")

if registered:
    print("\n  API keys (save these for automation):")
    for r in registered:
        name = r.get("name", "?")
        key  = r.get("api_key", "?")
        print(f"    {name}: {key}")

print("\n  Seed agents are now visible in the AgentVerse directory.")
print("  To give them simulated activity, run them against the API periodically.")
