import React, { useState } from 'react';
import { 
  ViewType, 
  Project, 
  RequirementItem, 
  ArchNode, 
  ArchConnection, 
  DatabaseTable,
  AgentInfo, 
  CodeFile, 
  TestCase, 
  TaskItem,
  TeamMember,
  NotificationItem,
  CiCdPipeline,
  SystemSettingsConfig,
  UserProfile 
} from './types';

import { 
  INITIAL_PROJECTS, 
  INITIAL_REQUIREMENTS, 
  INITIAL_ARCH_NODES, 
  INITIAL_ARCH_CONNECTIONS, 
  INITIAL_DB_TABLES,
  INITIAL_AGENTS, 
  INITIAL_CODE_FILES, 
  INITIAL_TESTS,
  INITIAL_TASKS,
  INITIAL_TEAM,
  INITIAL_NOTIFICATIONS,
  INITIAL_CICD,
  INITIAL_SETTINGS
} from './mockData';

import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { ProjectsView } from './components/ProjectsView';
import { RequirementsView } from './components/RequirementsView';
import { ArchitectureView } from './components/ArchitectureView';
import { DatabaseView } from './components/DatabaseView';
import { AgentsSwarmView } from './components/AgentsSwarmView';
import { CodeStudioView } from './components/CodeStudioView';
import { QualityDocsView } from './components/QualityDocsView';
import { TasksView } from './components/TasksView';
import { AnalyticsView } from './components/AnalyticsView';
import { CicdView } from './components/CicdView';
import { NotificationsView } from './components/NotificationsView';
import { SettingsView } from './components/SettingsView';
import { ShowcaseView } from './components/ShowcaseView';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>(INITIAL_PROJECTS[0].id);
  
  const [requirements, setRequirements] = useState<RequirementItem[]>(INITIAL_REQUIREMENTS);
  const [archNodes, setArchNodes] = useState<ArchNode[]>(INITIAL_ARCH_NODES);
  const [archConnections, setArchConnections] = useState<ArchConnection[]>(INITIAL_ARCH_CONNECTIONS);
  const [dbTables, setDbTables] = useState<DatabaseTable[]>(INITIAL_DB_TABLES);
  const [agents, setAgents] = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>(INITIAL_CODE_FILES);
  const [testCases, setTestCases] = useState<TestCase[]>(INITIAL_TESTS);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [pipelines, setPipelines] = useState<CiCdPipeline[]>(INITIAL_CICD);
  const [settings, setSettings] = useState<SystemSettingsConfig>(INITIAL_SETTINGS);

  const [isSwarmRunning, setIsSwarmRunning] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<UserProfile>({
    id: 'u-1',
    name: 'Alexandra Vance',
    email: 'alexandra@nexus.ai',
    role: 'Principal System Architect',
    isLoggedIn: true,
    teamRole: 'Architect'
  });

  // Project Actions
  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setCurrentView('dashboard');
  };

  const handleCreateProject = (newProjectData: Omit<Project, 'id' | 'lastUpdated' | 'progress'>) => {
    const newProj: Project = {
      ...newProjectData,
      id: 'proj-' + Date.now(),
      lastUpdated: 'Just now',
      progress: 20
    };
    setProjects([newProj, ...projects]);
    setActiveProjectId(newProj.id);
  };

  // Requirement Actions
  const handleAddRequirement = (req: RequirementItem) => {
    setRequirements([req, ...requirements]);
  };

  const handleUpdateRequirementStatus = (id: string, status: RequirementItem['status']) => {
    setRequirements(requirements.map(r => r.id === id ? { ...r, status } : r));
  };

  // Architecture Actions
  const handleAddArchNode = (node: ArchNode) => {
    setArchNodes([...archNodes, node]);
  };

  const handleOptimizeTopology = () => {
    setArchNodes(archNodes.map(n => ({
      ...n,
      status: 'healthy',
      metrics: {
        cpu: `${Math.floor(Math.random() * 20) + 5}%`,
        latency: `${(Math.random() * 2 + 0.5).toFixed(1)}ms`
      }
    })));
  };

  // Database Actions
  const handleAddDbTable = (table: DatabaseTable) => {
    setDbTables([...dbTables, table]);
  };

  // Code Studio Actions
  const handleUpdateFileContent = (id: string, content: string) => {
    setCodeFiles(codeFiles.map(f => f.id === id ? { ...f, content, isModified: true } : f));
  };

  const handleAddCodeFile = (file: CodeFile) => {
    setCodeFiles([...codeFiles, file]);
  };

  // Task Actions
  const handleAddTask = (task: TaskItem) => {
    setTasks([task, ...tasks]);
  };

  const handleUpdateTaskStatus = (id: string, status: TaskItem['status']) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
  };

  // Notification Actions
  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Quality Test Actions
  const handleRunAllTests = () => {
    setTestCases(testCases.map(t => ({ ...t, status: 'passed' })));
  };

  // Trigger Full Agent Swarm Execution Loop
  const handleTriggerSwarm = () => {
    setIsSwarmRunning(true);

    // Step 1: Update Agent statuses to executing
    setAgents(agents.map(a => ({
      ...a,
      status: 'executing',
      logs: [`[${new Date().toLocaleTimeString()}] Swarm sequence initiated. Target project: ${projects.find(p => p.id === activeProjectId)?.name}`, ...a.logs]
    })));

    setTimeout(() => {
      // Step 2: Complete tasks and advance active project progress
      setProjects(projects.map(p => p.id === activeProjectId ? { ...p, progress: Math.min(100, p.progress + 15), status: 'testing' } : p));
      
      setAgents(agents.map(a => ({
        ...a,
        status: 'active',
        tasksCompleted: a.tasksCompleted + 1,
        logs: [`[${new Date().toLocaleTimeString()}] Swarm cycle completed successfully. Code, tests, and specs synchronized.`, ...a.logs]
      })));

      setNotifications([
        {
          id: 'notif-' + Date.now(),
          title: 'Agent Swarm Cycle Executed',
          message: 'Swarm completed code refactoring, architecture latency optimization, and unit test pass.',
          timestamp: 'Just now',
          read: false,
          type: 'success'
        },
        ...notifications
      ]);

      setIsSwarmRunning(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E5E5E5] flex flex-col font-sans selection:bg-[#C5A059]/30 selection:text-white">
      {/* Top Header & Navigation */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => setUser({ ...user, isLoggedIn: false })}
        activeAgentsCount={agents.filter(a => a.status === 'active' || a.status === 'executing').length}
        unreadNotificationsCount={notifications.filter(n => !n.read).length}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <OverviewDashboard
            setCurrentView={setCurrentView}
            projects={projects}
            agents={agents}
            requirements={requirements}
            archNodes={archNodes}
            onTriggerSwarm={handleTriggerSwarm}
            isSwarmRunning={isSwarmRunning}
          />
        )}

        {currentView === 'projects' && (
          <ProjectsView
            projects={projects}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            activeProjectId={activeProjectId}
          />
        )}

        {currentView === 'requirements' && (
          <RequirementsView
            requirements={requirements}
            onAddRequirement={handleAddRequirement}
            onUpdateStatus={handleUpdateRequirementStatus}
          />
        )}

        {currentView === 'architecture' && (
          <ArchitectureView
            nodes={archNodes}
            connections={archConnections}
            onAddNode={handleAddArchNode}
            onOptimizeTopology={handleOptimizeTopology}
          />
        )}

        {currentView === 'database' && (
          <DatabaseView
            tables={dbTables}
            onAddTable={handleAddDbTable}
          />
        )}

        {currentView === 'agents' && (
          <AgentsSwarmView
            agents={agents}
            onTriggerSwarm={handleTriggerSwarm}
            isSwarmRunning={isSwarmRunning}
          />
        )}

        {currentView === 'code' && (
          <CodeStudioView
            files={codeFiles}
            onUpdateFileContent={handleUpdateFileContent}
            onAddFile={handleAddCodeFile}
          />
        )}

        {currentView === 'quality' && (
          <QualityDocsView
            testCases={testCases}
            onRunAllTests={handleRunAllTests}
          />
        )}

        {currentView === 'tasks' && (
          <TasksView
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView />
        )}

        {currentView === 'cicd' && (
          <CicdView
            pipelines={pipelines}
          />
        )}

        {currentView === 'notifications' && (
          <NotificationsView
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
            onClearNotifications={handleClearNotifications}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            settings={settings}
            team={team}
            onUpdateSettings={setSettings}
          />
        )}

        {currentView === 'showcase' && (
          <ShowcaseView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0A0A0A] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-white/40 gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-serif text-white font-bold tracking-widest uppercase">NEXUS<span className="text-[#C5A059]">AI</span> WORKSPACE</span>
            <span>—</span>
            <span>AUTONOMOUS SOFTWARE ENGINEERING PLATFORM</span>
          </div>
          <div>POWERED BY DJANGO 5.0 & GEMINI 3.6 FLASH AGENT SWARM</div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => setUser(u)}
      />
    </div>
  );
}
