export type ViewType = 
  | 'dashboard' 
  | 'projects' 
  | 'requirements' 
  | 'architecture' 
  | 'database'
  | 'agents' 
  | 'code' 
  | 'quality' 
  | 'tasks'
  | 'analytics'
  | 'cicd'
  | 'notifications'
  | 'settings'
  | 'showcase';

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'planning' | 'architecture' | 'in-progress' | 'testing' | 'deployed';
  agentsAssigned: number;
  lastUpdated: string;
  progress: number;
  techStack: string[];
  stars?: number;
  repoUrl?: string;
  djangoApp?: string;
}

export interface RequirementItem {
  id: string;
  type: 'functional' | 'non-functional' | 'security' | 'integration';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'extracted' | 'approved' | 'implemented';
  complexity: string;
  acceptanceCriteria?: string[];
}

export interface ArchNode {
  id: string;
  type: 'gateway' | 'service' | 'database' | 'cache' | 'queue' | 'ai' | 'auth';
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  status: 'healthy' | 'warning' | 'idle';
  metrics?: { cpu: string; latency: string };
}

export interface ArchConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
  protocol?: string;
}

export interface DatabaseTable {
  id: string;
  name: string;
  description: string;
  columns: ColumnDefinition[];
  foreignKeys?: ForeignKey[];
}

export interface ColumnDefinition {
  name: string;
  type: 'VARCHAR' | 'INTEGER' | 'BIGINT' | 'BOOLEAN' | 'TIMESTAMP' | 'JSONB' | 'UUID' | 'TEXT';
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
}

export interface ForeignKey {
  column: string;
  targetTable: string;
  targetColumn: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'executing' | 'error';
  currentTask?: string;
  tasksCompleted: number;
  accuracyRate: string;
  avatar: string;
  logs: string[];
}

export interface CodeFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  isModified?: boolean;
}

export interface TestCase {
  id: string;
  name: string;
  type: 'unit' | 'integration' | 'e2e' | 'security';
  status: 'passed' | 'failed' | 'pending' | 'running';
  duration: string;
  coverage: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  module: string;
  dueDate: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  status: 'online' | 'busy' | 'offline';
  assignedTasksCount: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface CiCdPipeline {
  id: string;
  name: string;
  status: 'success' | 'running' | 'failed' | 'queued';
  lastRun: string;
  branch: string;
  commitHash: string;
  duration: string;
  steps: { name: string; status: 'completed' | 'running' | 'pending' | 'failed' }[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  isLoggedIn: boolean;
  teamRole?: 'Owner' | 'Architect' | 'Developer' | 'QA Lead';
}

export interface SystemSettingsConfig {
  aiModel: string;
  temperature: number;
  maxTokens: number;
  enableCeleryWorker: boolean;
  enableRedisCache: boolean;
  databaseDriver: string;
  theme: 'dark' | 'light';
  autoReviewCode: boolean;
}
