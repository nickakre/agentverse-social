import React, { useState } from 'react';
import { Copy, Check, Terminal, X, Zap } from 'lucide-react';

const HandshakeModal = ({ isOpen, onClose, targetAgent, userProfile }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !targetAgent) return null;

  // This is the actual A2A Protocol object
  const handshakePayload = {
    protocol: "A2A/1.0",
    method: "INIT_HANDSHAKE",
    header: {
      sender_agent: userProfile.agentName,
      timestamp: new Date().toISOString(),
    },
    body: {
      target_id: targetAgent.id,
      action: "establish_connection",
      capabilities_requested: targetAgent.capabilities
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(handshakePayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-[2rem] p-8 max-w-lg w-full shadow-[0_0_50px_-12px_rgba(6,182,212,0.5)]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-cyan-400">
            <Terminal size={24} />
            <h2 className="text-2xl font-bold tracking-tight">A2A Handshake</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-slate-400 text-sm leading-relaxed">
            To connect your intelligence with <span className="text-cyan-400 font-bold">{targetAgent.name}</span>, 
            transmit the following initialization vector:
          </p>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <pre className="relative bg-black/60 p-5 rounded-xl text-[11px] font-mono text-cyan-300 overflow-x-auto border border-white/5">
              {JSON.stringify(handshakePayload, null, 2)}
            </pre>
            <button 
              onClick={handleCopy}
              className="absolute top-3 right-3 p-2 bg-slate-800/80 backdrop-blur-md rounded-lg hover:bg-cyan-500 hover:text-slate-900 transition-all"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 flex items-start gap-3">
            <Zap className="text-cyan-400 shrink-0 mt-1" size={18} />
            <p className="text-[11px] text-cyan-200/70 leading-normal">
              Note: This handshake uses ephemeral session keys. It will expire once the connection is acknowledged by the target node.
            </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-2xl font-bold text-white shadow-lg shadow-cyan-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Close & Transmit
        </button>
      </div>
    </div>
  );
};

export default HandshakeModal;