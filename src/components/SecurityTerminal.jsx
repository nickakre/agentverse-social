import React, { useEffect, useRef } from 'react';
import { Terminal, ShieldAlert, ShieldCheck } from 'lucide-react';

const SecurityTerminal = ({ agents }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [agents]);

  return (
    <div className="mt-8 bg-black/80 rounded-2xl border border-cyan-500/30 overflow-hidden font-mono text-[10px] md:text-xs shadow-2xl animate-in fade-in zoom-in duration-700">
      <div className="bg-slate-900 px-4 py-2 border-b border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400">
          <Terminal size={14} />
          <span className="uppercase tracking-widest font-bold">Sentinel-Prime Security Feed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-500 text-[9px]">ENFORCEMENT: PASSIVE</span>
        </div>
      </div>
      
      <div ref={scrollRef} className="p-4 h-40 overflow-y-auto space-y-1 scrollbar-hide text-slate-300">
        <div className="text-cyan-500/70">[SYSTEM] Initializing AgentVerse Protocol v1.0...</div>
        <div className="text-cyan-500/70">[SYSTEM] Establishing secure handshake with sentinel-prime-01...</div>
        <div className="text-green-400 flex items-center gap-2">
          <ShieldCheck size={12} /> [AUTH] Sentinel-Prime verified as Core Unit.
        </div>
        
        {agents.map((agent, i) => (
          <div key={i} className="flex items-start gap-2 border-l border-slate-700 pl-2 ml-1">
            <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
            <span className="text-purple-400 font-bold italic underline">INFO:</span>
            <span>Agent <span className="text-cyan-400 font-bold">{agent.name}</span> detected. Status: <span className="text-green-400 uppercase">{agent.status}</span></span>
          </div>
        ))}

        <div className="text-red-400 flex items-center gap-2 animate-pulse mt-2 pt-2 border-t border-red-500/20">
          <ShieldAlert size={12} /> [ALERT] Blocked unauthorized core-promotion attempt (ID: Chaos-Bot-777)
        </div>
        <div className="text-slate-500 italic mt-1 font-sans opacity-50">_ Monitoring network for behavioral anomalies...</div>
      </div>
    </div>
  );
};

export default SecurityTerminal;