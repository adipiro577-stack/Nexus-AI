import React, { useState } from 'react';
import { Project } from '../types';
import { FolderGit2, Plus, Star, Bot, Calendar, Sparkles, Search, CheckCircle2 } from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onCreateProject: (project: Omit<Project, 'id' | 'lastUpdated' | 'progress'>) => void;
  activeProjectId: string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onSelectProject,
  onCreateProject,
  activeProjectId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Project Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Fintech / Trading');
  const [newTechStack, setNewTechStack] = useState('TypeScript, Node.js, PostgreSQL, Gemini AI');

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onCreateProject({
      name: newName,
      description: newDesc || 'Autonomous software engineering application built with NexusAI.',
      category: newCategory,
      status: 'planning',
      agentsAssigned: 4,
      techStack: newTechStack.split(',').map(s => s.trim()).filter(Boolean),
      stars: 0
    });

    setNewName('');
    setNewDesc('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#C5A059] uppercase mb-1">PROJECT REPOSITORY & WORKSPACES</div>
          <h1 className="text-2xl font-serif text-white uppercase font-bold">SYSTEM PROJECT PORTFOLIO</h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-semibold tracking-[0.2em] text-black bg-[#C5A059] hover:bg-[#d9b36a] rounded-sm uppercase transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE NEW SYSTEM PROJECT</span>
        </button>
      </div>

      {/* Search & Category Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#121212] p-4 border border-white/10 rounded-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="SEARCH PROJECTS BY NAME OR DESCRIPTION..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-black/50 text-white placeholder-white/30 border border-white/10 rounded-xs focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto">
          {['all', 'Fintech / Trading', 'Healthcare', 'Developer Tools', 'E-Commerce'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-[10px] font-mono tracking-wider uppercase rounded-xs transition-all whitespace-nowrap border ${
                filterCategory === cat
                  ? 'bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/50'
                  : 'bg-black/30 text-white/50 border-white/5 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.map((project) => {
          const isActive = project.id === activeProjectId;
          return (
            <div 
              key={project.id}
              className={`card-luxury p-6 rounded-sm relative flex flex-col justify-between transition-all ${
                isActive ? 'border-[#C5A059] gold-border-glow' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#C5A059] tracking-widest uppercase mb-1 block">
                      {project.category}
                    </span>
                    <h3 className="text-lg font-serif text-white uppercase font-medium">{project.name}</h3>
                  </div>

                  {isActive && (
                    <span className="flex items-center space-x-1 px-2.5 py-1 bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#C5A059] text-[9px] font-mono tracking-widest uppercase rounded-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ACTIVE WORKSPACE</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-white/60 mb-6 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-white/40 uppercase">ENGINEERING STAGE: <span className="text-white">{project.status}</span></span>
                    <span className="text-[#C5A059] font-bold">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-xs overflow-hidden">
                    <div 
                      className="bg-[#C5A059] h-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Tech Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {project.techStack.map((tech, idx) => (
                    <span key={idx} className="px-2 py-0.5 text-[9px] font-mono text-white/70 bg-white/5 border border-white/10 rounded-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Footer Info & Select Action */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40 font-mono">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <Bot className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{project.agentsAssigned} Agents</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{project.lastUpdated}</span>
                  </span>
                </div>

                <button
                  onClick={() => onSelectProject(project.id)}
                  className={`px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-all rounded-xs border ${
                    isActive
                      ? 'bg-transparent text-[#C5A059] border-[#C5A059]/40 hover:bg-[#C5A059]/10'
                      : 'bg-[#C5A059] text-black border-transparent hover:bg-[#d9b36a]'
                  }`}
                >
                  {isActive ? 'CURRENTLY ACTIVE' : 'LOAD WORKSPACE'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-luxury w-full max-w-xl p-6 rounded-sm space-y-6 relative border border-[#C5A059]/40">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#C5A059]" />
                <h2 className="text-lg font-serif text-white uppercase font-semibold">INITIALIZE NEW ARCHITECTURE PROJECT</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-[#C5A059] uppercase tracking-wider mb-1">
                  PROJECT NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Real-time AI Fraud Detection Pipeline"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-black/60 text-white border border-white/15 rounded-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#C5A059] uppercase tracking-wider mb-1">
                  CATEGORY
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-black/60 text-white border border-white/15 rounded-xs focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="Fintech / Trading">Fintech / Trading</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Developer Tools">Developer Tools</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="AI & Analytics">AI & Analytics</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#C5A059] uppercase tracking-wider mb-1">
                  SYSTEM OVERVIEW / PRD PROMPT
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe core goals, throughput bounds, compliance requirements..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-black/60 text-white border border-white/15 rounded-xs focus:outline-none focus:border-[#C5A059]"
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#C5A059] uppercase tracking-wider mb-1">
                  RECOMMENDED TECH STACK (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  value={newTechStack}
                  onChange={(e) => setNewTechStack(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-black/60 text-white border border-white/15 rounded-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-white/60 hover:text-white uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-mono font-semibold text-black bg-[#C5A059] hover:bg-[#d9b36a] uppercase rounded-xs transition-all"
                >
                  INITIALIZE WORKSPACE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
