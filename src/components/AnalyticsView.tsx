import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, CartesianGrid 
} from 'recharts';
import { BarChart3, Activity, Cpu, Zap, Shield, Sparkles } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const systemPerformanceData = [
    { time: '00:00', qps: 120, latency: 1.2, cpu: 14, tokens: 4200 },
    { time: '04:00', qps: 240, latency: 1.1, cpu: 18, tokens: 8900 },
    { time: '08:00', qps: 890, latency: 1.8, cpu: 32, tokens: 24000 },
    { time: '12:00', qps: 1450, latency: 2.1, cpu: 48, tokens: 41000 },
    { time: '16:00', qps: 1120, latency: 1.5, cpu: 38, tokens: 32000 },
    { time: '20:00', qps: 680, latency: 1.3, cpu: 22, tokens: 18000 },
    { time: '23:59', qps: 310, latency: 1.0, cpu: 15, tokens: 9200 }
  ];

  const agentAccuracyData = [
    { agent: 'Aetheria PRD', accuracy: 99.4, tasks: 42 },
    { agent: 'Vortex System', accuracy: 98.9, tasks: 38 },
    { agent: 'Cipher Schema', accuracy: 99.8, tasks: 29 },
    { agent: 'Aura Dev', accuracy: 97.8, tasks: 56 },
    { agent: 'Sentinel Sec', accuracy: 100.0, tasks: 31 },
    { agent: 'Nexus QA', accuracy: 99.1, tasks: 48 }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121212] p-6 rounded-sm border border-white/10">
        <div>
          <div className="flex items-center space-x-2 text-[#C5A059] text-xs font-mono tracking-widest uppercase mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>REAL-TIME SYSTEM TELEMETRY</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">Platform Performance & AI Analytics</h1>
          <p className="text-xs text-white/50 mt-1">Live monitoring of system throughput (QPS), sub-millisecond database latency, AI agent accuracy rates, and token consumption.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#0A0A0A] px-3 py-1.5 rounded-sm border border-white/10 text-xs font-mono text-white/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>STATUS: OPTIMAL (99.99%)</span>
          </div>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-white/10 p-5 rounded-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-white/50 uppercase">
            <span>PEAK THROUGHPUT</span>
            <Activity className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">1,450 <span className="text-xs font-normal text-white/40">QPS</span></div>
          <div className="text-[10px] font-mono text-emerald-400">↑ 24% vs previous cycle</div>
        </div>

        <div className="bg-[#121212] border border-white/10 p-5 rounded-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-white/50 uppercase">
            <span>AVG LATENCY</span>
            <Zap className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">1.4 <span className="text-xs font-normal text-white/40">ms</span></div>
          <div className="text-[10px] font-mono text-emerald-400">RedisRESP Sub-ms Active</div>
        </div>

        <div className="bg-[#121212] border border-white/10 p-5 rounded-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-white/50 uppercase">
            <span>GEMINI TOKEN USAGE</span>
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">137,300 <span className="text-xs font-normal text-white/40">Tokens</span></div>
          <div className="text-[10px] font-mono text-[#C5A059]">Gemini 3.6 Flash Engine</div>
        </div>

        <div className="bg-[#121212] border border-white/10 p-5 rounded-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-white/50 uppercase">
            <span>SECURITY AUDIT SCORE</span>
            <Shield className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">100 / 100</div>
          <div className="text-[10px] font-mono text-white/40">OWASP Top 10 Compliant</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QPS & Latency Chart */}
        <div className="bg-[#121212] border border-white/10 rounded-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-mono font-bold text-white tracking-wider uppercase">SYSTEM QPS & THROUGHPUT</h3>
            <span className="text-[10px] font-mono text-[#C5A059]">24-HOUR TELEMETRY</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={systemPerformanceData}>
                <defs>
                  <linearGradient id="qpsColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A059" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0D0D0D', borderColor: '#333', color: '#fff', fontSize: '11px' }} />
                <Area type="monotone" dataKey="qps" stroke="#C5A059" fillOpacity={1} fill="url(#qpsColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Agent Accuracy Rates */}
        <div className="bg-[#121212] border border-white/10 rounded-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-mono font-bold text-white tracking-wider uppercase">AI AGENT SWARM ACCURACY (%)</h3>
            <span className="text-[10px] font-mono text-[#C5A059]">SYNTHETIC BENCHMARK</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentAccuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="agent" stroke="#666" fontSize={9} />
                <YAxis domain={[90, 100]} stroke="#666" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0D0D0D', borderColor: '#333', color: '#fff', fontSize: '11px' }} />
                <Bar dataKey="accuracy" fill="#C5A059" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
