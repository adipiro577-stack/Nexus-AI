from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
import json

from .models import (
    Project, Requirement, ArchNode, ArchConnection, DatabaseTable,
    AgentInfo, CodeFile, TestCase, TaskItem, TeamMember,
    NotificationItem, CiCdPipeline, SystemSetting, UserProfile
)
from .forms import ProjectForm, RequirementForm, TaskForm, LoginForm, RegisterForm
from .ai_services import analyze_requirements_python, generate_architecture_python, review_code_python

# Initial Mock Data Seeder helper if DB is empty
def seed_initial_data_if_needed():
    if Project.objects.exists():
        return
    
    p1 = Project.objects.create(
        name="Nexus-Core Matching Engine",
        description="High-frequency order book matching service with microsecond latency, C++ engine bindings, and Redis RESP event streams.",
        category="FinTech Engine",
        status="active",
        progress=85,
        tech_stack=["Python", "Django 5", "C++20", "PostgreSQL", "Redis RESP", "gRPC"],
        repo_url="https://github.com/nexusai/core-matching-engine"
    )

    Project.objects.create(
        name="Autonomous Spec Generator",
        description="AI multi-agent orchestration service that extracts PRDs, builds architectural node topologies, and outputs Django ORM code.",
        category="AI Infrastructure",
        status="planning",
        progress=40,
        tech_stack=["Python", "Gemini 3.6 Flash", "Celery", "PostgreSQL", "Redis"],
        repo_url="https://github.com/nexusai/spec-generator"
    )

    Requirement.objects.create(
        project=p1,
        title="Sub-Millisecond Order Book Depth Sync",
        description="Maintain double-ended order queues with microsecond time-priority execution.",
        priority="high",
        req_type="functional",
        status="approved",
        complexity="High"
    )
    Requirement.objects.create(
        project=p1,
        title="OAuth2 JWT Access Token Validation",
        description="Enforce Bearer token JWT validation at API Gateway with permission scope checks.",
        priority="high",
        req_type="security",
        status="extracted",
        complexity="Medium"
    )

    gw = ArchNode.objects.create(project=p1, label="API Gateway (Envoy)", sublabel="Rate Limiting & TLS", node_type="gateway", pos_x=80, pos_y=140, cpu="12%", latency="0.8ms")
    auth = ArchNode.objects.create(project=p1, label="Auth Service", sublabel="JWT & OAuth2", node_type="auth", pos_x=280, pos_y=60, cpu="8%", latency="1.2ms")
    eng = ArchNode.objects.create(project=p1, label="Matching Engine", sublabel="C++ Order Engine", node_type="service", pos_x=280, pos_y=220, cpu="24%", latency="0.3ms")
    db = ArchNode.objects.create(project=p1, label="PostgreSQL Cluster", sublabel="Primary / Replica", node_type="database", pos_x=520, pos_y=80, cpu="18%", latency="2.1ms")
    cache = ArchNode.objects.create(project=p1, label="Redis Cluster", sublabel="In-Memory Ledger", node_type="cache", pos_x=520, pos_y=240, cpu="15%", latency="0.1ms")

    ArchConnection.objects.create(project=p1, from_node=gw, to_node=auth, label="Verify Bearer", protocol="gRPC")
    ArchConnection.objects.create(project=p1, from_node=gw, to_node=eng, label="Stream Orders", protocol="WebSocket")
    ArchConnection.objects.create(project=p1, from_node=eng, to_node=cache, label="Read/Write Depth", protocol="RESP")
    ArchConnection.objects.create(project=p1, from_node=eng, to_node=db, label="Async Settle", protocol="PostgreSQL")

    DatabaseTable.objects.create(
        project=p1,
        name="orders",
        description="High-frequency limit order ledger table",
        columns=[
            {"name": "id", "type": "UUID", "pk": True, "nullable": False},
            {"name": "user_id", "type": "BIGINT", "pk": False, "nullable": False, "fk": "users.id"},
            {"name": "symbol", "type": "VARCHAR(20)", "pk": False, "nullable": False},
            {"name": "side", "type": "VARCHAR(4)", "pk": False, "nullable": False},
            {"name": "price", "type": "NUMERIC(18,8)", "pk": False, "nullable": False},
            {"name": "quantity", "type": "NUMERIC(18,8)", "pk": False, "nullable": False},
            {"name": "status", "type": "VARCHAR(20)", "pk": False, "nullable": False},
            {"name": "created_at", "type": "TIMESTAMPTZ", "pk": False, "nullable": False}
        ]
    )

    AgentInfo.objects.create(name="Spec Analyst Agent", role="Requirement Analyst", model="Gemini 3.6 Flash", status="active", tasks_completed=142, accuracy_rate="99.6%", logs=["[08:30:12] Spec parsing complete.", "[08:31:00] Requirements synchronized."])
    AgentInfo.objects.create(name="Architect Agent", role="System Architect", model="Gemini 3.6 Flash", status="active", tasks_completed=98, accuracy_rate="99.2%", logs=["[08:29:45] Topology latency verified.", "[08:31:10] gRPC links validated."])
    AgentInfo.objects.create(name="DB Schema Agent", role="Database Specialist", model="Gemini 3.6 Flash", status="idle", tasks_completed=115, accuracy_rate="99.8%", logs=["[08:28:00] Django models generated."])
    AgentInfo.objects.create(name="Code Generator Agent", role="Code Generator", model="Gemini 3.6 Flash", status="active", tasks_completed=230, accuracy_rate="98.9%", logs=["[08:32:15] Refactored matching loop."])
    AgentInfo.objects.create(name="QA Test Agent", role="QA & Security Auditor", model="Gemini 3.6 Flash", status="active", tasks_completed=180, accuracy_rate="99.5%", logs=["[08:33:00] 24 unit test cases passed."])

    CodeFile.objects.create(
        project=p1,
        name="settings.py",
        path="nexus_project/settings.py",
        language="python",
        content="""# Django Settings Configuration
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'nexusai_app',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'nexusdb',
        'USER': 'nexus_user',
        'HOST': '127.0.0.1',
        'PORT': '5432',
    }
}"""
    )

    TestCase.objects.create(project=p1, name="test_order_book_matching_latency", suite="Matching Engine Unit", duration="0.04s", status="passed", coverage="99.1%")
    TestCase.objects.create(project=p1, name="test_jwt_bearer_token_verification", suite="Security Audit Suite", duration="0.12s", status="passed", coverage="98.2%")

    TaskItem.objects.create(project=p1, title="Refactor C++ Order Book Bindings", description="Expose pybind11 wrappers to Django async channel handlers.", assigned_agent="Code Generator Agent", priority="high", status="in-progress")
    TaskItem.objects.create(project=p1, title="OWASP Top 10 Security Scan", description="Verify input sanitization on all raw REST endpoints.", assigned_agent="QA Test Agent", priority="medium", status="completed")

    NotificationItem.objects.create(title="Agent Swarm Cycle Completed", message="Swarm completed code refactoring, topology latency optimization, and unit test pass.", timestamp="Just now", read=False, notif_type="success")
    NotificationItem.objects.create(title="PostgreSQL Cluster Healthy", message="Replication lag is 0.2ms across all regional read replicas.", timestamp="10m ago", read=True, notif_type="info")

    CiCdPipeline.objects.create(name="Main Production Deploy", branch="main", status="success", duration="38s", triggered_by="Agent Swarm", logs=["[1/4] Linting code...", "[2/4] Running pytest...", "[3/4] Building Docker image...", "[4/4] Deployed to Cloud Run."])

def get_context_data():
    seed_initial_data_if_needed()
    projects = Project.objects.all()
    active_project = projects.first()
    return {
        'projects': projects,
        'active_project': active_project,
        'requirements': Requirement.objects.all(),
        'arch_nodes': ArchNode.objects.all(),
        'arch_connections': ArchConnection.objects.all(),
        'db_tables': DatabaseTable.objects.all(),
        'agents': AgentInfo.objects.all(),
        'code_files': CodeFile.objects.all(),
        'test_cases': TestCase.objects.all(),
        'tasks': TaskItem.objects.all(),
        'notifications': NotificationItem.objects.all(),
        'pipelines': CiCdPipeline.objects.all(),
        'active_agents_count': AgentInfo.objects.filter(status__in=['active', 'executing']).count(),
        'unread_notifs_count': NotificationItem.objects.filter(read=False).count(),
        'user_profile': {
            'name': 'Alexandra Vance',
            'email': 'alexandra@nexus.ai',
            'role': 'Principal System Architect',
            'team_role': 'Architect',
            'is_logged_in': True
        }
    }

# Views
def dashboard_view(request):
    ctx = get_context_data()
    ctx['current_view'] = 'dashboard'
    return render(request, 'pages/dashboard.html', ctx)

def projects_view(request):
    ctx = get_context_data()
    ctx['current_view'] = 'projects'
    ctx['form'] = ProjectForm()
    return render(request, 'pages/projects.html', ctx)

def requirements_view(request):
    ctx = get_context_data()
    ctx['current_view'] = 'requirements'
    ctx['form'] = RequirementForm()
    return render(request, 'pages/requirements.html', ctx)

def architecture_view(request):
    ctx = get_context_data()
    ctx['current_view'] = 'architecture'
    return render(request, 'pages/architecture.html', ctx)

def database_view(request):
    ctx = get_context_data()
    ctx['current_view'] = 'database'
    return render(request, 'pages/database.html', ctx)

def agents_view(request):
    ctx = get_context_data()
    ctx['current_view'] = 'agents'
    return render(request, 'pages/agents.html', ctx)

def code_studio_view(request):
    ctx = get_context_data()
    ctx['current_view'] = 'code'
    return render(request, 'pages/code_studio.html', ctx)

def quality_docs_view(request):
    ctx = get_context_data()
    ctx['current_view'] = 'quality'
    return render(request, 'pages/quality_docs.html', ctx)

def tasks_view(request):
    ctx = get_context_data()
    ctx['current_view'] = 'tasks'
    ctx['form'] = TaskForm()
    return render(request, 'pages/tasks.html', ctx)

def analytics_view(request):
    ctx = get_context_data()
    ctx['current_view'] = 'analytics'
    return render(request, 'pages/analytics.html', ctx)

def cicd_view(request):
    ctx = get_context_data()
    ctx['current_view'] = 'cicd'
    return render(request, 'pages/cicd.html', ctx)

def notifications_view(request):
    ctx = get_context_data()
    ctx['current_view'] = 'notifications'
    return render(request, 'pages/notifications.html', ctx)

def settings_view(request):
    ctx = get_context_data()
    ctx['current_view'] = 'settings'
    return render(request, 'pages/settings.html', ctx)

def showcase_view(request):
    ctx = get_context_data()
    ctx['current_view'] = 'showcase'
    return render(request, 'pages/showcase.html', ctx)

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            user = authenticate(username=form.cleaned_data['username'], password=form.cleaned_data['password'])
            if user:
                login(request, user)
                return redirect('dashboard')
    ctx = {'login_form': LoginForm()}
    return render(request, 'pages/login.html', ctx)

def register_view(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = User.objects.create_user(
                username=form.cleaned_data['username'],
                email=form.cleaned_data['email'],
                password=form.cleaned_data['password']
            )
            UserProfile.objects.create(user=user, role=form.cleaned_data['role'])
            login(request, user)
            return redirect('dashboard')
    ctx = {'register_form': RegisterForm()}
    return render(request, 'pages/register.html', ctx)

# API Endpoints
@csrf_exempt
def api_analyze_requirements(request):
    if request.method == 'POST':
        data = json.loads(request.body or '{}')
        raw_prompt = data.get('rawPrompt', '')
        category = data.get('category', 'General')
        reqs = analyze_requirements_python(raw_prompt, category)
        return JsonResponse({'requirements': reqs})
    return JsonResponse({'error': 'POST method required'}, status=400)

@csrf_exempt
def api_generate_architecture(request):
    if request.method == 'POST':
        data = json.loads(request.body or '{}')
        summary = data.get('requirementsSummary', '')
        topo = generate_architecture_python(summary)
        return JsonResponse(topo)
    return JsonResponse({'error': 'POST method required'}, status=400)

@csrf_exempt
def api_review_code(request):
    if request.method == 'POST':
        data = json.loads(request.body or '{}')
        code = data.get('code', '')
        filename = data.get('filename', 'main.py')
        mode = data.get('mode', 'refactor')
        res = review_code_python(code, filename, mode)
        return JsonResponse(res)
    return JsonResponse({'error': 'POST method required'}, status=400)
