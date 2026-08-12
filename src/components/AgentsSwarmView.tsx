import React, { useState } from 'react';
import { AgentInfo } from '../types';
import { Bot, Play, Pause, RefreshCw, Terminal, CheckCircle2, ShieldAlert, Cpu, Sparkles, Activity } from 'lucide-react';

interface AgentsSwarmViewProps {
  agents: AgentInfo[];
  onTriggerSwarm: () => void;
  isSwarmRunning: boolean;
}

export const AgentsSwarmView: React.FC<AgentsSwarmViewProps> = ({
  agents,
  onTriggerSwarm,
  isSwarmRunning
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  const activeAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#C5A059] uppercase mb-1">STAGE 03 — MULTI-AGENT SWARM COMMAND CENTER</div>
          <h1 className="text-2xl font-serif text-white uppercase font-bold">AUTONOMOUS SWARM ORCHESTRATOR</h1>
        </div>

        <button
          onClick={onTriggerSwarm}
          disabled={isSwarmRunning}
          className={`flex items-center justify-center space-x-2 px-5 py-2.5 text-xs font-semibold tracking-[0.2em] uppercase rounded-sm transition-all shadow-md ${
            isSwarmRunning
              ? 'bg-[#C5A059]/40 text-black/60 cursor-not-allowed'
              : 'bg-[#C5A059] text-black hover:bg-[#d9b36a]'
          }`}
        >
          <Play className={`w-3.5 h-3.5 ${isSwarmRunning ? 'animate-spin' : ''}`} />
          <span>{isSwarmRunning ? 'EXECUTING PIPELINE...' : 'EXECUTE ALL AGENTS'}</span>
        </button>
      </div>

      {/* Agents Grid & Selected Agent Live Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <div className="space-y-3">
          <div className="text-[10px] font-mono text-[#C5A059] uppercase tracking-wider mb-2">SPECIALIZED SWARM AGENTS ({agents.length})</div>
          
          {agents.map((agent) => {
            const isSelected = agent.id === selectedAgentId;
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`card-luxury p-4 rounded-sm cursor-pointer transition-all flex items-center justify-between ${
                  isSelected ? 'border-[#C5A059] gold-border-glow bg-[#181818]' : 'hover:border-white/20'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{agent.avatar}</span>
                  <div>
                    <h3 className="text-xs font-serif text-white font-medium uppercase">{agent.name}</h3>
                    <p className="text-[10px] font-mono text-white/40">{agent.role}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest rounded-xs ${
                    agent.status === 'executing' ? 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40 animate-pulse' :
                    agent.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    'bg-white/5 text-white/40'
                  }`}>
                    {agent.status}
                  </span>
                  <div className="text-[9px] font-mono text-white/30 mt-1">Acc: {agent.accuracyRate}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Agent Live Terminal Console */}
        <div className="lg:col-span-2 card-luxury p-6 rounded-sm space-y-6 flex flex-col justify-between bg-[#0A0A0A] border border-white/10">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{activeAgent.avatar}</span>
                <div>
                  <h2 className="text-base font-serif text-white uppercase font-semibold">{activeAgent.name}</h2>
                  <p className="text-xs font-mono text-[#C5A059] uppercase">{activeAgent.role}</p>
                </div>
              </div>

              <div className="text-right font-mono text-xs text-white/60">
                <div>Tasks: <span className="text-white font-bold">{activeAgent.tasksCompleted}</span></div>
                <div>Accuracy: <span className="text-emerald-400 font-bold">{activeAgent.accuracyRate}</span></div>
              </div>
            </div>

            {/* Current Active Task */}
            <div className="p-3 bg-black border border-white/10 rounded-xs mb-6">
              <div className="text-[9px] font-mono text-white/40 uppercase mb-1">CURRENT ASSIGNED TASK</div>
              <div className="text-xs font-mono text-white flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping"></span>
                <span>{activeAgent.currentTask || 'Idle — Standing by for user request'}</span>
              </div>
            </div>

            {/* Agent Live Terminal Output Logs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-white/40 uppercase">
                <span className="flex items-center space-x-1">
                  <Terminal className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>AGENT LOG OUTPUT STREAM</span>
                </span>
                <span>REALTIME TELEMETRY</span>
              </div>

              <div className="bg-black/90 p-4 rounded-xs border border-white/10 font-mono text-xs text-emerald-400 space-y-2 max-h-[280px] overflow-y-auto leading-relaxed">
                {activeAgent.logs.map((log, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-white/30 text-[10px] shrink-0">&gt;</span>
                    <span className="break-all">{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
            <span>MODEL: GEMINI 3.6 PRO / FLASH ENSEMBLE</span>
            <span>AUTONOMOUS FEEDBACK LOOP ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
