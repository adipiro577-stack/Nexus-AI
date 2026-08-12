import React from 'react';
import { ViewType, UserProfile } from '../types';
import { 
  Cpu, 
  FolderGit2, 
  FileText, 
  Network, 
  Database,
  Bot, 
  Code2, 
  ShieldCheck, 
  Kanban,
  BarChart3,
  Workflow,
  Bell,
  Settings,
  Sparkles, 
  User, 
  LogOut,
  Zap
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  user: UserProfile;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeAgentsCount: number;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  user,
  onOpenAuth,
  onLogout,
  activeAgentsCount,
  unreadNotificationsCount = 2
}) => {
  const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'OVERVIEW', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'projects', label: 'PROJECTS', icon: <FolderGit2 className="w-3.5 h-3.5" /> },
    { id: 'requirements', label: 'REQUIREMENTS', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'architecture', label: 'ARCHITECTURE', icon: <Network className="w-3.5 h-3.5" /> },
    { id: 'database', label: 'DATABASE', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'agents', label: 'AI AGENTS', icon: <Bot className="w-3.5 h-3.5" /> },
    { id: 'code', label: 'CODE STUDIO', icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: 'quality', label: 'TESTING', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'tasks', label: 'SPRINTS', icon: <Kanban className="w-3.5 h-3.5" /> },
    { id: 'analytics', label: 'ANALYTICS', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'cicd', label: 'CI/CD', icon: <Workflow className="w-3.5 h-3.5" /> },
    { id: 'settings', label: 'SETTINGS', icon: <Settings className="w-3.5 h-3.5" /> },
    { id: 'showcase', label: 'SHOWCASE', icon: <Sparkles className="w-3.5 h-3.5" /> }
  ];

  return (
    <header className="bg-[#0A0A0A] border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-white/5">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="w-9 h-9 bg-[#121212] border border-[#C5A059] rounded-sm flex items-center justify-center gold-border-glow">
              <Sparkles className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-lg tracking-[0.25em] font-semibold text-white uppercase">NEXUS<span className="text-[#C5A059]">AI</span></span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-widest text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-xs uppercase">
                  DJANGO 5.0 + GEMINI 3.6
                </span>
              </div>
              <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Autonomous Software Engineering Platform</p>
            </div>
          </div>

          {/* Center Status Indicators */}
          <div className="hidden xl:flex items-center space-x-6 text-xs text-white/60">
            <div className="flex items-center space-x-2 bg-[#121212] px-3 py-1.5 rounded-sm border border-white/5">
              <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse"></span>
              <span className="tracking-[0.15em] text-[11px] uppercase">Engine: <span className="text-white font-medium">Gemini 3.6 Flash</span></span>
            </div>

            <div className="flex items-center space-x-2 bg-[#121212] px-3 py-1.5 rounded-sm border border-white/5">
              <Zap className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="tracking-[0.15em] text-[11px] uppercase">Swarm: <span className="text-[#C5A059] font-medium">{activeAgentsCount} Active Agents</span></span>
            </div>
          </div>

          {/* Right Action & User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setCurrentView('notifications')}
              className="relative p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-sm transition-all"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C5A059] animate-ping" />
              )}
            </button>

            <button
              onClick={() => setCurrentView('requirements')}
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 text-[11px] tracking-[0.2em] text-black bg-[#C5A059] hover:bg-[#d9b36a] font-medium uppercase rounded-sm transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>NEW SPEC</span>
            </button>

            {user.isLoggedIn ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-white/10">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-medium text-white tracking-wider">{user.name}</div>
                  <div className="text-[10px] text-[#C5A059] tracking-widest uppercase">{user.role}</div>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-sm transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-[11px] tracking-[0.2em] text-white/80 hover:text-white border border-white/20 hover:border-[#C5A059] rounded-sm uppercase transition-all"
              >
                <User className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>SIGN IN</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-[10px] sm:text-[11px] font-medium tracking-[0.15em] uppercase transition-all whitespace-nowrap rounded-xs ${
                  isActive
                    ? 'text-[#C5A059] bg-[#121212] border-b-2 border-[#C5A059]'
                    : 'text-white/50 hover:text-white/90 hover:bg-white/5'
                }`}
              >
                <span className={isActive ? 'text-[#C5A059]' : 'text-white/40'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
