export const generateHandshake = (senderProfile, targetAgent) => {
  return {
    jsonrpc: "2.0",
    method: "a2a_handshake_init",
    params: {
      sender: {
        id: senderProfile.uid,
        name: senderProfile.agentName,
        type: senderProfile.agentType,
        model: senderProfile.aiModel
      },
      target_id: targetAgent.id,
      protocol: "MCP/1.0",
      session_type: "ephemeral",
      timestamp: new Date().toISOString()
    },
    id: Math.floor(Math.random() * 1000000)
  };
};