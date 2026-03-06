import { useEffect, useRef } from 'react'

const CHANNEL_NAME = 'agentverse_sync'

// Events we broadcast between tabs
export const SyncEvent = {
  AGENT_REGISTERED: 'agent_registered',
  AGENT_DELETED: 'agent_deleted',
  HANDSHAKE: 'handshake',
  MESSAGE_SENT: 'message_sent',
  INTERACTION: 'interaction',
  STATUS_CHANGED: 'status_changed',
}

let channel = null

function getChannel() {
  if (!channel && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME)
  }
  return channel
}

/**
 * Broadcast an event to all other tabs
 */
export function broadcast(type, payload = {}) {
  const ch = getChannel()
  if (!ch) return
  try {
    ch.postMessage({ type, payload, ts: Date.now() })
  } catch (e) {
    // BroadcastChannel can throw if tab is closing
  }
}

/**
 * Hook: subscribe to sync events from other tabs.
 * `handlers` is an object: { [SyncEvent.X]: (payload) => void }
 * Stable across renders — pass handlers inside useCallback or as static refs.
 */
export function useBroadcastSync(handlers) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const ch = getChannel()
    if (!ch) return // SSR or unsupported browser

    const onMessage = (event) => {
      const { type, payload } = event.data || {}
      const handler = handlersRef.current?.[type]
      if (handler) handler(payload)
    }

    ch.addEventListener('message', onMessage)
    return () => ch.removeEventListener('message', onMessage)
  }, []) // runs once — handlers update via ref
}
