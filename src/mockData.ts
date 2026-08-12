import { 
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
  SystemSettingsConfig
} from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'NexusAI Enterprise Platform',
    description: 'Autonomous multi-agent software engineering & architecture orchestration system.',
    category: 'Full-Stack SaaS',
    status: 'in-progress',
    agentsAssigned: 6,
    lastUpdated: '10 minutes ago',
    progress: 78,
    techStack: ['Python', 'Django 5.0', 'React 19', 'PostgreSQL', 'Redis', 'Gemini 3.6', 'Celery'],
    stars: 128,
    repoUrl: 'github.com/nexusai/enterprise-platform',
    djangoApp: 'nexus_core'
  },
  {
    id: 'proj-2',
    name: 'High-Frequency Matching Engine',
    description: 'Ultra-low latency sub-millisecond order book matching system with Redis memory cache.',
    category: 'FinTech Backend',
    status: 'testing',
    agentsAssigned: 4,
    lastUpdated: '1 hour ago',
    progress: 92,
    techStack: ['Python', 'Django REST', 'C++ Core', 'Redis RESP', 'Kafka'],
    stars: 84,
    repoUrl: 'github.com/nexusai/order-book',
    djangoApp: 'matching_engine'
  },
  {
    id: 'proj-3',
    name: 'HealthPulse Telemedicine Suite',
    description: 'HIPAA-compliant EHR integration pipeline with real-time video streaming & diagnostic AI.',
    category: 'Healthcare Cloud',
    status: 'planning',
    agentsAssigned: 3,
    lastUpdated: '3 hours ago',
    progress: 35,
    techStack: ['Python', 'Django', 'PostgreSQL', 'WebRTC', 'FastAPI'],
    stars: 45,
    repoUrl: 'github.com/nexusai/healthpulse',
    djangoApp: 'health_records'
  }
];

export const INITIAL_REQUIREMENTS: RequirementItem[] = [
  {
    id: 'req-1',
    type: 'security',
    title: 'OAuth2 & JWT Multi-Tenant Authentication',
    description: 'Enforce RBAC role-based access control with refresh token rotation and session isolation in Django middleware.',
    priority: 'high',
    status: 'approved',
    complexity: 'Medium',
    acceptanceCriteria: [
      'Support Google OAuth2 and JWT token validation',
      'Enforce session timeout after 30 minutes of inactivity',
      'Provide middleware for tenant database separation'
    ]
  },
  {
    id: 'req-2',
    type: 'functional',
    title: 'Multi-Agent Swarm Orchestration Loop',
    description: 'Coordinate 6 specialized AI agents to generate requirements, architecture, code, and security audits asynchronously via Celery.',
    priority: 'high',
    status: 'approved',
    complexity: 'High',
    acceptanceCriteria: [
      'Sub-2 second response latency for requirement extraction',
      'Streaming output via Server-Sent Events (SSE)',
      'Fallback to local rule engine if AI provider times out'
    ]
  },
  {
    id: 'req-3',
    type: 'integration',
    title: 'PostgreSQL Vector Search & RAG Pipeline',
    description: 'Index codebase AST nodes into pgvector for semantic architecture queries and automated code reviews.',
    priority: 'medium',
    status: 'extracted',
    complexity: 'High',
    acceptanceCriteria: [
      'Store code embeddings using Gemini Embeddings API',
      'Query top-k code snippets with cosine similarity < 0.2'
    ]
  },
  {
    id: 'req-4',
    type: 'non-functional',
    title: '99.99% Availability & Sub-50ms Latency',
    description: 'Maintain high availability across database replicas and load-balanced Django Cloud Run instances.',
    priority: 'high',
    status: 'approved',
    complexity: 'Medium',
    acceptanceCriteria: [
      'Pass load testing up to 10,000 requests/sec',
      'Zero downtime during schema migrations'
    ]
  }
];

export const INITIAL_ARCH_NODES: ArchNode[] = [
  { id: 'node-gw', type: 'gateway', label: 'Nginx / Cloud Run Gateway', sublabel: 'Port 3000 / TLS 1.3', x: 80, y: 160, status: 'healthy', metrics: { cpu: '14%', latency: '0.9ms' } },
  { id: 'node-django', type: 'service', label: 'Django Full-Stack Core', sublabel: 'WSGI / ASGI Router', x: 280, y: 80, status: 'healthy', metrics: { cpu: '22%', latency: '1.4ms' } },
  { id: 'node-celery', type: 'queue', label: 'Celery / Redis Queue', sublabel: 'Async AI Swarm Workers', x: 280, y: 260, status: 'healthy', metrics: { cpu: '35%', latency: '2.8ms' } },
  { id: 'node-postgres', type: 'database', label: 'PostgreSQL + pgvector', sublabel: 'Primary Relational & Vector', x: 520, y: 80, status: 'healthy', metrics: { cpu: '19%', latency: '3.1ms' } },
  { id: 'node-redis', type: 'cache', label: 'Redis Enterprise Cache', sublabel: 'Session & RESP State', x: 520, y: 200, status: 'healthy', metrics: { cpu: '8%', latency: '0.2ms' } },
  { id: 'node-ai', type: 'ai', label: 'Gemini 3.6 Pro API', sublabel: 'Google Cloud Vertex Proxy', x: 520, y: 320, status: 'healthy', metrics: { cpu: '12%', latency: '120ms' } }
];

export const INITIAL_ARCH_CONNECTIONS: ArchConnection[] = [
  { id: 'c1', from: 'node-gw', to: 'node-django', label: 'HTTP / WS', protocol: 'HTTPS' },
  { id: 'c2', from: 'node-django', to: 'node-postgres', label: 'Django ORM', protocol: 'Psycopg3' },
  { id: 'c3', from: 'node-django', to: 'node-redis', label: 'Session / Cache', protocol: 'Redis' },
  { id: 'c4', from: 'node-django', to: 'node-celery', label: 'Task Dispatch', protocol: 'AMQP' },
  { id: 'c5', from: 'node-celery', to: 'node-ai', label: 'Gemini Prompting', protocol: 'HTTPS REST' }
];

export const INITIAL_DB_TABLES: DatabaseTable[] = [
  {
    id: 'tbl-1',
    name: 'nexus_projects',
    description: 'Stores top-level engineering projects and lifecycle tracking.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, isNullable: false },
      { name: 'name', type: 'VARCHAR', isNullable: false },
      { name: 'description', type: 'TEXT', isNullable: true },
      { name: 'category', type: 'VARCHAR', isNullable: false },
      { name: 'status', type: 'VARCHAR', isNullable: false, defaultValue: "'planning'" },
      { name: 'progress', type: 'INTEGER', isNullable: false, defaultValue: '0' },
      { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'NOW()' }
    ]
  },
  {
    id: 'tbl-2',
    name: 'nexus_requirements',
    description: 'Stores functional and non-functional requirements extracted by AI.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, isNullable: false },
      { name: 'project_id', type: 'UUID', isNullable: false },
      { name: 'title', type: 'VARCHAR', isNullable: false },
      { name: 'type', type: 'VARCHAR', isNullable: false },
      { name: 'priority', type: 'VARCHAR', isNullable: false },
      { name: 'status', type: 'VARCHAR', isNullable: false, defaultValue: "'extracted'" },
      { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'NOW()' }
    ],
    foreignKeys: [
      { column: 'project_id', targetTable: 'nexus_projects', targetColumn: 'id' }
    ]
  },
  {
    id: 'tbl-3',
    name: 'nexus_agent_logs',
    description: 'Audit telemetry for multi-agent swarm task executions.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, isNullable: false },
      { name: 'agent_name', type: 'VARCHAR', isNullable: false },
      { name: 'action', type: 'VARCHAR', isNullable: false },
      { name: 'payload', type: 'JSONB', isNullable: true },
      { name: 'execution_time_ms', type: 'INTEGER', isNullable: false },
      { name: 'created_at', type: 'TIMESTAMP', isNullable: false, defaultValue: 'NOW()' }
    ]
  }
];

export const INITIAL_AGENTS: AgentInfo[] = [
  {
    id: 'agent-1',
    name: 'Aetheria PRD',
    role: 'AI Requirement Specialist',
    status: 'active',
    currentTask: 'Extracting user stories and priority tags from seed prompt',
    tasksCompleted: 42,
    accuracyRate: '99.4%',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    logs: [
      '[08:25:10] Parsing input seed prompt...',
      '[08:25:11] Extracted 4 functional requirements & 1 security criteria.'
    ]
  },
  {
    id: 'agent-2',
    name: 'Vortex System',
    role: 'Lead System Architect',
    status: 'active',
    currentTask: 'Optimizing microservices topology & API Gateway rules',
    tasksCompleted: 38,
    accuracyRate: '98.9%',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    logs: [
      '[08:24:02] Connected Redis cluster to Django WSGI app.',
      '[08:24:05] Calculated network latency < 1.2ms.'
    ]
  },
  {
    id: 'agent-3',
    name: 'Cipher Schema',
    role: 'Database & ORM Engineer',
    status: 'idle',
    currentTask: 'Standby for schema migration trigger',
    tasksCompleted: 29,
    accuracyRate: '99.8%',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    logs: [
      '[08:20:11] Validated PostgreSQL foreign key index constraints.',
      '[08:20:15] Generated Django models.py schema definition.'
    ]
  },
  {
    id: 'agent-4',
    name: 'Aura Full-Stack',
    role: 'Full-Stack Developer',
    status: 'executing',
    currentTask: 'Refactoring Django template view handlers and REST serializers',
    tasksCompleted: 56,
    accuracyRate: '97.8%',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    logs: [
      '[08:26:01] Compiled server.ts Express & Django integration routes.',
      '[08:26:04] Verified zero syntax or type declaration errors.'
    ]
  },
  {
    id: 'agent-5',
    name: 'Sentinel Security',
    role: 'OWASP Security Auditor',
    status: 'active',
    currentTask: 'Auditing CSRF middleware and token expiration policies',
    tasksCompleted: 31,
    accuracyRate: '100%',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    logs: [
      '[08:22:40] Scanned code for hardcoded credentials. Status: CLEAN.',
      '[08:22:45] Enforced HTTPS header security rules.'
    ]
  },
  {
    id: 'agent-6',
    name: 'Nexus QA & Docs',
    role: 'Testing & Spec Agent',
    status: 'idle',
    currentTask: 'Standing by for test suite run',
    tasksCompleted: 48,
    accuracyRate: '99.1%',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    logs: [
      '[08:19:00] Generated OpenAPI 3.0 specification file.',
      '[08:19:05] Verified 100% route test coverage.'
    ]
  }
];

export const INITIAL_CODE_FILES: CodeFile[] = [
  {
    id: 'file-1',
    name: 'views.py',
    path: 'nexus_core/views.py',
    language: 'python',
    content: `from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Project, Requirement

def dashboard_view(request):
    """
    Renders main NexusAI workspace dashboard with Django template context.
    """
    projects = Project.objects.all().order_by('-updated_at')
    active_count = projects.filter(status='in-progress').count()
    
    context = {
        'projects': projects,
        'active_count': active_count,
        'title': 'NexusAI Workspace Dashboard'
    }
    return render(request, 'nexus_core/dashboard.html', context)

@require_http_methods(["POST"])
def analyze_requirements(request):
    """
    Proxies AI requirement extraction to Gemini backend service.
    """
    prompt = request.POST.get('prompt', '')
    if not prompt:
        return JsonResponse({'error': 'Prompt is required'}, status=400)
        
    # Proxy to Django AI service layer
    requirements = extract_ai_requirements(prompt)
    return JsonResponse({'status': 'success', 'requirements': requirements})
`
  },
  {
    id: 'file-2',
    name: 'models.py',
    path: 'nexus_core/models.py',
    language: 'python',
    content: `from django.db import models
from django.contrib.auth.models import User
import uuid

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100)
    status = models.CharField(
        max_length=50, 
        choices=[
            ('planning', 'Planning'),
            ('architecture', 'Architecture'),
            ('in-progress', 'In Progress'),
            ('testing', 'Testing'),
            ('deployed', 'Deployed')
        ],
        default='planning'
    )
    progress = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Requirement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='requirements')
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=20, default='medium')
    type = models.CharField(max_length=50, default='functional')
    status = models.CharField(max_length=50, default='extracted')

    def __str__(self):
        return f"{self.title} ({self.priority})"
`
  },
  {
    id: 'file-3',
    name: 'base_dashboard.html',
    path: 'templates/base_dashboard.html',
    language: 'html',
    content: `{% extends "base.html" %}

{% block content %}
<div class="flex h-screen bg-[#0D0D0D] text-[#E5E5E5]">
  <!-- Navigation Sidebar -->
  <aside class="w-64 border-r border-white/10 bg-[#0A0A0A] p-4 flex flex-col justify-between">
    <div>
      <div class="flex items-center space-x-3 mb-8">
        <span class="font-serif text-lg font-bold tracking-widest text-white">NEXUS<span class="text-[#C5A059]">AI</span></span>
      </div>
      <nav class="space-y-1">
        <a href="{% url 'dashboard' %}" class="flex items-center px-3 py-2 text-sm rounded-md bg-[#C5A059]/10 text-[#C5A059]">Dashboard</a>
        <a href="{% url 'projects' %}" class="flex items-center px-3 py-2 text-sm text-gray-400 hover:text-white">Projects</a>
        <a href="{% url 'requirements' %}" class="flex items-center px-3 py-2 text-sm text-gray-400 hover:text-white">Requirements</a>
        <a href="{% url 'architecture' %}" class="flex items-center px-3 py-2 text-sm text-gray-400 hover:text-white">Architecture</a>
        <a href="{% url 'database' %}" class="flex items-center px-3 py-2 text-sm text-gray-400 hover:text-white">Database Design</a>
      </nav>
    </div>
  </aside>

  <!-- Main View Frame -->
  <main class="flex-1 overflow-y-auto p-8">
    {% block page_content %}{% endblock %}
  </main>
</div>
{% endblock %}
`
  }
];

export const INITIAL_TESTS: TestCase[] = [
  { id: 'test-1', name: 'Verify JWT Token Auth & CSRF Middleware', type: 'security', status: 'passed', duration: '12ms', coverage: '100%' },
  { id: 'test-2', name: 'Django ORM Project & Requirement Creation', type: 'unit', status: 'passed', duration: '8ms', coverage: '98%' },
  { id: 'test-3', name: 'Gemini 3.6 Flash Server-Side AI API Proxy', type: 'integration', status: 'passed', duration: '145ms', coverage: '96%' },
  { id: 'test-4', name: 'Redis Cache Memory Memory Read/Write', type: 'unit', status: 'passed', duration: '2ms', coverage: '100%' },
  { id: 'test-5', name: 'PostgreSQL Relational Foreign Key Cascade', type: 'e2e', status: 'passed', duration: '22ms', coverage: '95%' }
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Configure Celery Async Swarm Queue',
    description: 'Set up Redis message broker for long-running AI code analysis.',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Vortex System',
    module: 'Backend Infra',
    dueDate: '2026-08-15'
  },
  {
    id: 'task-2',
    title: 'Implement Django Views with Template Context',
    description: 'Replace static JSON mocks with Django template tags {{ project.name }}.',
    status: 'done',
    priority: 'high',
    assignee: 'Aura Full-Stack',
    module: 'Django Templates',
    dueDate: '2026-08-12'
  },
  {
    id: 'task-3',
    title: 'OWASP Security Vulnerability Scan',
    description: 'Audit environment secrets and enforce server-side API proxying.',
    status: 'done',
    priority: 'high',
    assignee: 'Sentinel Security',
    module: 'Security',
    dueDate: '2026-08-12'
  },
  {
    id: 'task-4',
    title: 'Database Schema Visualizer & Migration Export',
    description: 'Allow exporting interactive DB models into Django models.py & Drizzle schema.',
    status: 'review',
    priority: 'medium',
    assignee: 'Cipher Schema',
    module: 'Database',
    dueDate: '2026-08-14'
  }
];

export const INITIAL_TEAM: TeamMember[] = [
  { id: 'tm-1', name: 'Alexandra Vance', email: 'alexandra@nexus.ai', role: 'Principal Architect', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', status: 'online', assignedTasksCount: 4 },
  { id: 'tm-2', name: 'Marcus Thorne', email: 'marcus@nexus.ai', role: 'Lead Backend Engineer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', status: 'online', assignedTasksCount: 3 },
  { id: 'tm-3', name: 'Elena Rostova', email: 'elena@nexus.ai', role: 'AI Systems Specialist', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', status: 'busy', assignedTasksCount: 5 },
  { id: 'tm-4', name: 'David Chen', email: 'david@nexus.ai', role: 'QA & Security Lead', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', status: 'online', assignedTasksCount: 2 }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'notif-1', title: 'AI Swarm Task Completed', message: 'Requirement Specialist generated 4 functional specifications for NexusAI Enterprise.', timestamp: '5 mins ago', read: false, type: 'success' },
  { id: 'notif-2', title: 'Security Audit Passed', message: 'Sentinel Security verified 0 vulnerabilities in Django views and server routes.', timestamp: '20 mins ago', read: false, type: 'info' },
  { id: 'notif-3', title: 'Topology Optimized', message: 'Vortex System reduced API Gateway latency by 18% with Redis caching.', timestamp: '1 hour ago', read: true, type: 'success' }
];

export const INITIAL_CICD: CiCdPipeline[] = [
  {
    id: 'pipe-1',
    name: 'Main Production Build & Test',
    status: 'success',
    lastRun: '12 mins ago',
    branch: 'main',
    commitHash: 'a7b9c1d',
    duration: '1m 24s',
    steps: [
      { name: 'Lint & Type Check', status: 'completed' },
      { name: 'Django Unit Tests', status: 'completed' },
      { name: 'Build Web Bundle', status: 'completed' },
      { name: 'Deploy Cloud Run', status: 'completed' }
    ]
  },
  {
    id: 'pipe-2',
    name: 'Security & Dependency Audit',
    status: 'success',
    lastRun: '1 hour ago',
    branch: 'main',
    commitHash: 'a7b9c1d',
    duration: '42s',
    steps: [
      { name: 'OWASP Dependency Check', status: 'completed' },
      { name: 'Secret Leaks Scanner', status: 'completed' }
    ]
  }
];

export const INITIAL_SETTINGS: SystemSettingsConfig = {
  aiModel: 'Gemini 3.6 Flash',
  temperature: 0.2,
  maxTokens: 4096,
  enableCeleryWorker: true,
  enableRedisCache: true,
  databaseDriver: 'PostgreSQL 16',
  theme: 'dark',
  autoReviewCode: true
};
