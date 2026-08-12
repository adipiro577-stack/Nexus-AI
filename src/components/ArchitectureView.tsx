import React, { useState } from 'react';
import { ArchNode, ArchConnection } from '../types';
import { Network, Plus, Zap, Cpu, Database, Lock, Layers, Activity, RefreshCw, Shield, Server } from 'lucide-react';

interface ArchitectureViewProps {
  nodes: ArchNode[];
  connections: ArchConnection[];
  onAddNode: (node: ArchNode) => void;
  onOptimizeTopology: () => void;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({
  nodes,
  connections,
  onAddNode,
  onOptimizeTopology
}) => {
  const [selectedNode, setSelectedNode] = useState<ArchNode | null>(nodes[0] || null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // New Node Modal Form
  const [showAddNode, setShowAddNode] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newSublabel, setNewSublabel] = useState('');
  const [newType, setNewType] = useState<ArchNode['type']>('service');

  const handleOptimizeClick = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      onOptimizeTopology();
      setIsOptimizing(false);
    }, 1000);
  };

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const newNode: ArchNode = {
      id: 'node-' + Date.now(),
      type: newType,
      label: newLabel,
      sublabel: newSublabel || 'Custom Microservice',
      x: 350 + Math.floor(Math.random() * 200),
      y: 150 + Math.floor(Math.random() * 200),
      status: 'healthy',
      metrics: { cpu: '10%', latency: '2.1ms' }
    };

    onAddNode(newNode);
    setSelectedNode(newNode);
    setNewLabel('');
    setNewSublabel('');
    setShowAddNode(false);
  };

  const getNodeIcon = (type: ArchNode['type']) => {
    switch (type) {
      case 'gateway': return <Server className="w-4 h-4 text-cyan-400" />;
      case 'auth': return <Lock className="w-4 h-4 text-purple-400" />;
      case 'ai': return <Zap className="w-4 h-4 text-[#C5A059]" />;
      case 'database': return <Database className="w-4 h-4 text-emerald-400" />;
      case 'cache': return <Activity className="w-4 h-4 text-amber-400" />;
      case 'queue': return <Layers className="w-4 h-4 text-blue-400" />;
      default: return <Cpu className="w-4 h-4 text-white" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#C5A059] uppercase mb-1">STAGE 02 — ARCHITECTURE GRAPH SYSTEM</div>
          <h1 className="text-2xl font-serif text-white uppercase font-bold">MICROSERVICES & DATA TOPOLOGY VISUALIZER</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleOptimizeClick}
            disabled={isOptimizing}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-semibold tracking-[0.2em] text-black bg-[#C5A059] hover:bg-[#d9b36a] rounded-sm uppercase transition-all shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>AI TOPOLOGY OPTIMIZER</span>
          </button>

          <button
            onClick={() => setShowAddNode(!showAddNode)}
            className="flex items-center justify-center space-x-2 px-3.5 py-2.5 text-xs font-semibold tracking-[0.2em] text-white/90 border border-white/20 hover:border-[#C5A059] rounded-sm uppercase transition-all bg-black/40"
          >
            <Plus className="w-4 h-4 text-[#C5A059]" />
            <span>ADD NODE</span>
          </button>
        </div>
      </div>

      {/* Add Node Form Collapsible */}
      {showAddNode && (
        <form onSubmit={handleCreateNode} className="card-luxury p-5 rounded-sm space-y-4 border border-[#C5A059]/40">
          <h3 className="text-xs font-mono text-[#C5A059] uppercase tracking-wider">ATTACH MICROSERVICE ARCHITECTURE NODE</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">NODE LABEL</label>
              <input
                type="text"
                required
                placeholder="e.g., Notification Dispatcher"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-black/60 text-white border border-white/15 rounded-xs focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">NODE TYPE</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-mono bg-black/60 text-white border border-white/15 rounded-xs focus:outline-none focus:border-[#C5A059]"
              >
                <option value="service">Service Core</option>
                <option value="gateway">API Gateway</option>
                <option value="auth">OAuth / Auth</option>
                <option value="ai">AI Model Engine</option>
                <option value="cache">In-Memory Cache</option>
                <option value="database">Database</option>
                <option value="queue">Event Message Queue</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">SUB-LABEL / STACK</label>
              <input
                type="text"
                placeholder="e.g., Node.js / Express Cluster"
                value={newSublabel}
                onChange={(e) => setNewSublabel(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-black/60 text-white border border-white/15 rounded-xs focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowAddNode(false)}
              className="px-3 py-1.5 text-xs font-mono text-white/60 uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-mono bg-[#C5A059] text-black font-semibold uppercase rounded-xs"
            >
              Attach Node
            </button>
          </div>
        </form>
      )}

      {/* Main Canvas & Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Interactive Topology Graph Area */}
        <div className="lg:col-span-3 card-luxury p-6 rounded-sm relative min-h-[500px] bg-[#0A0A0A] overflow-hidden flex flex-col justify-between border border-white/10">
          {/* Grid Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

          {/* Graph Header overlay */}
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center space-x-2">
              <Network className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-mono text-white/80 uppercase tracking-widest">SYSTEM TOPOLOGY CANVAS ({nodes.length} NODES)</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-xs uppercase">
              ALL SYSTEMS HEALTHY
            </span>
          </div>

          {/* Graph Interactive Stage */}
          <div className="relative z-10 my-8 min-h-[380px] flex flex-wrap items-center justify-center gap-6 p-4">
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`cursor-pointer p-4 rounded-sm bg-[#121212] border transition-all duration-200 w-56 hover:scale-105 shadow-lg ${
                    isSelected 
                      ? 'border-[#C5A059] gold-border-glow bg-[#181818]' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-black rounded-xs border border-white/10">
                        {getNodeIcon(node.type)}
                      </div>
                      <span className="text-[9px] font-mono text-[#C5A059] uppercase tracking-wider">{node.type}</span>
                    </div>

                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>

                  <h4 className="text-xs font-serif text-white uppercase font-medium mb-1 truncate">{node.label}</h4>
                  <p className="text-[10px] font-mono text-white/40 truncate">{node.sublabel}</p>

                  {node.metrics && (
                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/50">
                      <span>CPU: {node.metrics.cpu}</span>
                      <span>LAT: {node.metrics.latency}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Graph Connection Flow Legend */}
          <div className="relative z-10 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono text-white/40">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-0.5 bg-[#C5A059]"></span>
                <span>gRPC / REST</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-0.5 bg-cyan-400"></span>
                <span>WebSocket Dispatch</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-0.5 bg-purple-400"></span>
                <span>Kafka Event Bus</span>
              </span>
            </div>

            <span>SELECT A NODE TO VIEW DEEP METRICS & DATA PIPELINES</span>
          </div>
        </div>

        {/* Selected Node Inspector Sidebar */}
        <div className="card-luxury p-6 rounded-sm space-y-6">
          {selectedNode ? (
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-wider">NODE METRICS INSPECTOR</span>
                <span className="p-1.5 bg-black border border-white/10 rounded-xs">{getNodeIcon(selectedNode.type)}</span>
              </div>

              <h3 className="text-base font-serif text-white uppercase font-semibold mb-1">{selectedNode.label}</h3>
              <p className="text-xs font-mono text-white/50 mb-6">{selectedNode.sublabel}</p>

              <div className="space-y-4">
                <div className="p-3 bg-black/40 border border-white/5 rounded-xs space-y-2">
                  <div className="text-[10px] font-mono text-white/40 uppercase">STATUS</div>
                  <div className="text-xs font-mono text-emerald-400 uppercase font-medium flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>ONLINE & HEALTHY</span>
                  </div>
                </div>

                <div className="p-3 bg-black/40 border border-white/5 rounded-xs space-y-2">
                  <div className="text-[10px] font-mono text-white/40 uppercase">ESTIMATED THROUGHPUT</div>
                  <div className="text-xs font-mono text-white font-medium">14,200 requests/sec</div>
                </div>

                <div className="p-3 bg-black/40 border border-white/5 rounded-xs space-y-2">
                  <div className="text-[10px] font-mono text-white/40 uppercase">LATENCY & HARDWARE METRICS</div>
                  <div className="flex justify-between text-xs font-mono text-white">
                    <span>CPU LOAD: {selectedNode.metrics?.cpu || '12%'}</span>
                    <span>LATENCY: {selectedNode.metrics?.latency || '1.8ms'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3">INBOUND / OUTBOUND PIPELINES</h4>
                <div className="space-y-2">
                  {connections
                    .filter(c => c.from === selectedNode.id || c.to === selectedNode.id)
                    .map((conn) => (
                      <div key={conn.id} className="p-2.5 bg-white/5 border border-white/5 rounded-xs text-[10px] font-mono">
                        <div className="text-[#C5A059] uppercase font-medium">{conn.label}</div>
                        <div className="text-white/40 flex justify-between mt-1">
                          <span>{conn.protocol}</span>
                          <span>{conn.from === selectedNode.id ? 'OUTBOUND' : 'INBOUND'}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-white/40 text-xs font-mono">
              Click any node on the topology graph to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
