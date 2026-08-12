import React from 'react';
import { ViewType, Project, AgentInfo, RequirementItem, ArchNode } from '../types';
import { 
  Cpu, 
  Bot, 
  FolderGit2, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Zap,
  Activity,
  Layers,
  Code2
} from 'lucide-react';

interface OverviewDashboardProps {
  setCurrentView: (view: ViewType) => void;
  projects: Project[];
  agents: AgentInfo[];
  requirements: RequirementItem[];
  archNodes: ArchNode[];
  onTriggerSwarm: () => void;
  isSwarmRunning: boolean;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  setCurrentView,
  projects,
  agents,
  requirements,
  archNodes,
  onTriggerSwarm,
  isSwarmRunning
}) => {
  const activeProject = projects[0];
  const activeAgentsCount = agents.filter(a => a.status === 'active' || a.status === 'executing').length;
  const approvedReqsCount = requirements.filter(r => r.status === 'approved' || r.status === 'implemented').length;

  return (
    <div className="space-[#121212] space-y-8 animate-fadeIn">
      {/* Hero Banner Banner */}
      <div className="relative overflow-hidden rounded-sm bg-gradient-to-r from-[#121212] via-[#181818] to-[#0F0F0F] border border-white/10 p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-xs text-[10px] tracking-[0.25em] text-[#C5A059] uppercase font-mono">
              <Sparkles className="w-3 h-3" />
              <span>Multi-Agent Swarm Engine Online</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif tracking-wide text-white uppercase font-bold">
              Autonomous Software Engineering Workspace
            </h1>
            <p className="text-sm text-white/60 leading-relaxed font-light">
              NexusAI orchestrates 6 specialized AI agents across specification drafting, architecture layout, database migration, full-stack code generation, and automated QA.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onTriggerSwarm}
              disabled={isSwarmRunning}
              className={`flex items-center justify-center space-x-2 px-5 py-3 text-xs tracking-[0.2em] font-semibold uppercase rounded-sm transition-all shadow-lg ${
                isSwarmRunning 
                  ? 'bg-[#C5A059]/40 text-black/60 cursor-not-allowed' 
                  : 'bg-[#C5A059] text-black hover:bg-[#d9b36a] hover:shadow-[#C5A059]/20'
              }`}
            >
              <Zap className={`w-4 h-4 ${isSwarmRunning ? 'animate-spin' : ''}`} />
              <span>{isSwarmRunning ? 'SWARM EXECUTING...' : 'RUN FULL AGENT SWARM'}</span>
            </button>

            <button
              onClick={() => setCurrentView('showcase')}
              className="flex items-center justify-center space-x-2 px-4 py-3 text-xs tracking-[0.2em] text-white/80 hover:text-white border border-white/20 hover:border-[#C5A059] rounded-sm uppercase transition-all bg-black/40"
            >
              <span>PREVIEW APPLICATION</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-luxury p-5 rounded-sm">
          <div className="flex items-center justify-between text-white/50 mb-3">
            <span className="text-[11px] font-mono tracking-[0.15em] uppercase">ACTIVE PROJECTS</span>
            <FolderGit2 className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-2xl font-serif text-white font-semibold mb-1">{projects.length} Active</div>
          <div className="text-[11px] text-white/40 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-medium">+1 new</span>
            <span>this week</span>
          </div>
        </div>

        <div className="card-luxury p-5 rounded-sm">
          <div className="flex items-center justify-between text-white/50 mb-3">
            <span className="text-[11px] font-mono tracking-[0.15em] uppercase">AGENT SWARM STATUS</span>
            <Bot className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-2xl font-serif text-white font-semibold mb-1">{activeAgentsCount} / {agents.length} Online</div>
          <div className="text-[11px] text-white/40 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 font-medium">99.3%</span>
            <span>avg accuracy rate</span>
          </div>
        </div>

        <div className="card-luxury p-5 rounded-sm">
          <div className="flex items-center justify-between text-white/50 mb-3">
            <span className="text-[11px] font-mono tracking-[0.15em] uppercase">REQUIREMENTS VERIFIED</span>
            <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-2xl font-serif text-white font-semibold mb-1">{approvedReqsCount} / {requirements.length}</div>
          <div className="text-[11px] text-white/40 flex items-center space-x-1">
            <span className="text-[#C5A059] font-medium">100% PRD</span>
            <span>coverage</span>
          </div>
        </div>

        <div className="card-luxury p-5 rounded-sm">
          <div className="flex items-center justify-between text-white/50 mb-3">
            <span className="text-[11px] font-mono tracking-[0.15em] uppercase">GRAPH NODES HEALTH</span>
            <Activity className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-2xl font-serif text-white font-semibold mb-1">{archNodes.length} Microservices</div>
          <div className="text-[11px] text-white/40 flex items-center space-x-1">
            <span className="text-emerald-400 font-medium">1.4ms</span>
            <span>avg response latency</span>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Project Progress & Lifecycle Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-luxury p-6 rounded-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <div className="text-[10px] font-mono tracking-widest text-[#C5A059] uppercase mb-1">CURRENT ACTIVE SYSTEM</div>
                <h2 className="text-xl font-serif text-white uppercase font-medium">{activeProject.name}</h2>
              </div>
              <span className="px-3 py-1 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-[10px] font-mono uppercase tracking-widest rounded-xs">
                {activeProject.status}
              </span>
            </div>

            <p className="text-xs text-white/60 mb-6 leading-relaxed">
              {activeProject.description}
            </p>

            {/* Software Engineering Lifecycle Progress */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70 font-mono tracking-wider uppercase">Lifecycle Pipeline Execution Progress</span>
                <span className="text-[#C5A059] font-mono font-bold">{activeProject.progress}%</span>
              </div>

              <div className="w-full bg-white/5 h-2 rounded-xs overflow-hidden p-0.5 border border-white/10">
                <div 
                  className="bg-gradient-to-r from-[#9A7B38] to-[#C5A059] h-full rounded-xs transition-all duration-500" 
                  style={{ width: `${activeProject.progress}%` }}
                ></div>
              </div>

              {/* Lifecycle Stage Steps */}
              <div className="grid grid-cols-5 gap-2 pt-2 text-center text-[10px] font-mono uppercase tracking-wider">
                <div className={`py-1.5 rounded-xs border ${activeProject.progress >= 20 ? 'bg-[#C5A059]/15 border-[#C5A059]/40 text-[#C5A059]' : 'border-white/5 text-white/30'}`}>
                  1. PRD Spec
                </div>
                <div className={`py-1.5 rounded-xs border ${activeProject.progress >= 40 ? 'bg-[#C5A059]/15 border-[#C5A059]/40 text-[#C5A059]' : 'border-white/5 text-white/30'}`}>
                  2. Arch Graph
                </div>
                <div className={`py-1.5 rounded-xs border ${activeProject.progress >= 60 ? 'bg-[#C5A059]/15 border-[#C5A059]/40 text-[#C5A059]' : 'border-white/5 text-white/30'}`}>
                  3. DB Schema
                </div>
                <div className={`py-1.5 rounded-xs border ${activeProject.progress >= 80 ? 'bg-[#C5A059]/15 border-[#C5A059]/40 text-[#C5A059]' : 'border-white/5 text-white/30'}`}>
                  4. Code Build
                </div>
                <div className={`py-1.5 rounded-xs border ${activeProject.progress >= 95 ? 'bg-[#C5A059]/15 border-[#C5A059]/40 text-[#C5A059]' : 'border-white/5 text-white/30'}`}>
                  5. QA & Deploy
                </div>
              </div>
            </div>

            {/* Tech Stack Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/5">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest mr-2">TECH STACK:</span>
              {activeProject.techStack.map((tech, i) => (
                <span key={i} className="px-2.5 py-1 text-[10px] font-mono text-white/80 bg-white/5 border border-white/10 rounded-xs">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Lifecycle Quick Access Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div 
              onClick={() => setCurrentView('requirements')}
              className="card-luxury p-4 rounded-sm cursor-pointer group hover:border-[#C5A059]/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-wider">STAGE 01</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#C5A059] group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-serif text-white uppercase font-medium mb-1">AI PRD Generator</h3>
              <p className="text-[11px] text-white/50">Extract requirements & security bounds with Gemini 3.6 Flash.</p>
            </div>

            <div 
              onClick={() => setCurrentView('architecture')}
              className="card-luxury p-4 rounded-sm cursor-pointer group hover:border-[#C5A059]/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-wider">STAGE 02</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#C5A059] group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-serif text-white uppercase font-medium mb-1">Arch Topology Visualizer</h3>
              <p className="text-[11px] text-white/50">Interactive graph diagram for microservices & data flows.</p>
            </div>

            <div 
              onClick={() => setCurrentView('code')}
              className="card-luxury p-4 rounded-sm cursor-pointer group hover:border-[#C5A059]/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-wider">STAGE 03</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#C5A059] group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-serif text-white uppercase font-medium mb-1">Code Studio</h3>
              <p className="text-[11px] text-white/50">AI assisted code generation, refactoring, and AST checks.</p>
            </div>
          </div>
        </div>

        {/* Live Swarm Activity Stream */}
        <div className="card-luxury p-6 rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-[#C5A059]" />
                <h3 className="text-sm font-serif text-white uppercase font-medium tracking-wider">SWARM ACTIVITY STREAM</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {agents.map((agent) => (
                <div key={agent.id} className="p-3 bg-black/40 border border-white/5 rounded-xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{agent.avatar}</span>
                      <span className="text-white font-medium">{agent.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-mono uppercase rounded-xs ${
                      agent.status === 'executing' ? 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40 animate-pulse' :
                      agent.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      'bg-white/5 text-white/40'
                    }`}>
                      {agent.status}
                    </span>
                  </div>

                  {agent.currentTask && (
                    <p className="text-[11px] text-white/60 font-mono line-clamp-1">
                      &gt; {agent.currentTask}
                    </p>
                  )}

                  <div className="text-[9px] font-mono text-white/30 flex items-center justify-between pt-1 border-t border-white/5">
                    <span>Tasks completed: {agent.tasksCompleted}</span>
                    <span>Accuracy: {agent.accuracyRate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setCurrentView('agents')}
            className="w-full mt-4 py-2.5 text-center text-[11px] font-mono text-[#C5A059] border border-[#C5A059]/30 hover:bg-[#C5A059]/10 rounded-xs uppercase tracking-widest transition-all"
          >
            VIEW AGENT COMMAND CENTER &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
