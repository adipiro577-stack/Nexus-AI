from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseForbidden
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_POST
from django.contrib.auth.models import User
import json
import time
from functools import wraps

from .models import (
    Project, Requirement, ArchNode, ArchConnection, DatabaseTable,
    AgentInfo, CodeFile, TestCase, TaskItem, TeamMember,
    NotificationItem, CiCdPipeline, SystemSetting, UserProfile
)
from .forms import ProjectForm, RequirementForm, TaskForm, LoginForm, RegisterForm
from .ai_services import analyze_requirements_python, generate_architecture_python, review_code_python
from .middleware import ADMIN_REAUTH_SESSION_KEY

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

def get_context_data(request):
    """Build page context from the current user's records; staff can inspect all records."""
    user = request.user
    is_admin = bool(user.is_staff or user.is_superuser)

    if is_admin:
        projects = Project.objects.all().order_by("-updated_at")
        requirements = Requirement.objects.all()
        arch_nodes = ArchNode.objects.all()
        arch_connections = ArchConnection.objects.all()
        db_tables = DatabaseTable.objects.all()
        agents = AgentInfo.objects.all()
        code_files = CodeFile.objects.all()
        test_cases = TestCase.objects.all()
        tasks = TaskItem.objects.all()
        notifications = NotificationItem.objects.all()
        pipelines = CiCdPipeline.objects.all()
    else:
        projects = Project.objects.filter(owner=user).order_by("-updated_at")
        requirements = Requirement.objects.filter(project__owner=user)
        arch_nodes = ArchNode.objects.filter(project__owner=user)
        arch_connections = ArchConnection.objects.filter(project__owner=user)
        db_tables = DatabaseTable.objects.filter(project__owner=user)
        code_files = CodeFile.objects.filter(project__owner=user)
        test_cases = TestCase.objects.filter(project__owner=user)
        tasks = TaskItem.objects.filter(project__owner=user)
        # These records have no user/project relationship yet, so expose them only to staff.
        agents = AgentInfo.objects.none()
        notifications = NotificationItem.objects.none()
        pipelines = CiCdPipeline.objects.none()

    active_project = projects.first()
    try:
        profile = user.profile
        role = profile.role
        team_role = profile.team_role
    except UserProfile.DoesNotExist:
        role = "Administrator" if is_admin else "System Architect"
        team_role = "Admin" if is_admin else "Architect"

    display_name = user.get_full_name().strip() or user.username
    return {
        "projects": projects,
        "active_project": active_project,
        "requirements": requirements,
        "arch_nodes": arch_nodes,
        "arch_connections": arch_connections,
        "db_tables": db_tables,
        "agents": agents,
        "code_files": code_files,
        "test_cases": test_cases,
        "tasks": tasks,
        "notifications": notifications,
        "pipelines": pipelines,
        "active_agents_count": agents.filter(status__in=["active", "executing"]).count(),
        "unread_notifs_count": notifications.filter(read=False).count(),
        "user_profile": {
            "name": display_name,
            "email": user.email,
            "role": role,
            "team_role": team_role,
            "is_logged_in": True,
            "is_admin": is_admin,
        },
    }

# Views
@login_required
def dashboard_view(request):
    ctx = get_context_data(request)
    ctx['current_view'] = 'dashboard'
    return render(request, 'pages/dashboard.html', ctx)

@login_required
def projects_view(request):
    ctx = get_context_data(request)
    ctx['current_view'] = 'projects'
    ctx['form'] = ProjectForm()
    return render(request, 'pages/projects.html', ctx)

@login_required
def requirements_view(request):
    ctx = get_context_data(request)
    ctx['current_view'] = 'requirements'
    ctx['form'] = RequirementForm()
    return render(request, 'pages/requirements.html', ctx)

@login_required
def architecture_view(request):
    ctx = get_context_data(request)
    ctx['current_view'] = 'architecture'
    return render(request, 'pages/architecture.html', ctx)

@login_required
def database_view(request):
    ctx = get_context_data(request)
    ctx['current_view'] = 'database'

    # Account directory is read-only. Staff can inspect all accounts;
    # regular users can see only their own account details.
    from django.db.models import Count
    if request.user.is_staff or request.user.is_superuser:
        account_queryset = User.objects.all().annotate(
            project_count=Count('projects', distinct=True)
        ).order_by('id')
        ctx['account_directory_scope'] = 'all'
    else:
        account_queryset = User.objects.filter(pk=request.user.pk).annotate(
            project_count=Count('projects', distinct=True)
        )
        ctx['account_directory_scope'] = 'own'

    ctx['account_directory'] = account_queryset
    ctx['account_directory_count'] = account_queryset.count()
    return render(request, 'pages/database.html', ctx)

@login_required
def agents_view(request):
    ctx = get_context_data(request)
    ctx['current_view'] = 'agents'
    return render(request, 'pages/agents.html', ctx)

@login_required
def code_studio_view(request):
    ctx = get_context_data(request)
    ctx['current_view'] = 'code'
    return render(request, 'pages/code_studio.html', ctx)

@login_required
def quality_docs_view(request):
    ctx = get_context_data(request)
    ctx['current_view'] = 'quality'
    return render(request, 'pages/quality_docs.html', ctx)

@login_required
def tasks_view(request):
    ctx = get_context_data(request)
    ctx['current_view'] = 'tasks'
    ctx['form'] = TaskForm()
    return render(request, 'pages/tasks.html', ctx)

@login_required
def analytics_view(request):
    ctx = get_context_data(request)
    ctx['current_view'] = 'analytics'
    return render(request, 'pages/analytics.html', ctx)

@login_required
def cicd_view(request):
    ctx = get_context_data(request)
    ctx['current_view'] = 'cicd'
    return render(request, 'pages/cicd.html', ctx)

@login_required
def notifications_view(request):
    ctx = get_context_data(request)
    ctx['current_view'] = 'notifications'
    return render(request, 'pages/notifications.html', ctx)

@login_required
def settings_view(request):
    ctx = get_context_data(request)
    ctx['current_view'] = 'settings'
    return render(request, 'pages/settings.html', ctx)

@login_required
def showcase_view(request):
    ctx = get_context_data(request)
    ctx['current_view'] = 'showcase'
    return render(request, 'pages/showcase.html', ctx)

def login_view(request):
    requested_next = request.POST.get("next") or request.GET.get("next") or ""
    safe_next = requested_next if url_has_allowed_host_and_scheme(
        requested_next,
        allowed_hosts={request.get_host()},
        require_https=request.is_secure(),
    ) else ""

    form = LoginForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        identifier = form.cleaned_data["username"].strip()
        password = form.cleaned_data["password"]
        candidate = User.objects.filter(email__iexact=identifier).order_by("pk").first() if "@" in identifier else None
        username = candidate.username if candidate is not None else identifier
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect(safe_next or "dashboard")
        form.add_error(None, "Invalid username/email or password.")

    return render(
        request,
        "pages/login.html",
        {"login_form": form, "next": safe_next},
    )

def register_view(request):
    form = RegisterForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        username = form.cleaned_data["username"].strip()
        email = form.cleaned_data["email"].strip().lower()
        password = form.cleaned_data["password"]
        role = form.cleaned_data.get("role", "Principal System Architect")

        if User.objects.filter(username__iexact=username).exists():
            form.add_error("username", "This username is already in use.")
        elif User.objects.filter(email__iexact=email).exists():
            form.add_error("email", "An account with this email already exists.")
        else:
            candidate = User(username=username, email=email)
            try:
                validate_password(password, user=candidate)
            except ValidationError as exc:
                form.add_error("password", " ".join(exc.messages))
            else:
                try:
                    with transaction.atomic():
                        user = User.objects.create_user(
                            username=username,
                            email=email,
                            password=password,
                        )
                        # Role is descriptive only; it never grants staff/admin permissions.
                        UserProfile.objects.create(user=user, role=role, team_role="Architect")
                except IntegrityError:
                    form.add_error(None, "Unable to create this account. Please check the details and try again.")
                else:
                    login(request, user)
                    return redirect("dashboard")

    return render(request, "pages/register.html", {"register_form": form})


@login_required
def admin_reauth_view(request):
    """Require the signed-in staff user to confirm their password before admin access."""
    if not request.user.is_staff:
        return HttpResponseForbidden("Django staff access is required.")

    requested_next = request.POST.get("next") or request.GET.get("next") or "/admin/"
    safe_next = requested_next if url_has_allowed_host_and_scheme(
        requested_next,
        allowed_hosts={request.get_host()},
        require_https=request.is_secure(),
    ) else "/admin/"

    error = ""
    if request.method == "GET":
        # Opening the Admin link always invalidates the previous unlock.
        request.session.pop(ADMIN_REAUTH_SESSION_KEY, None)
    elif request.method == "POST":
        password = request.POST.get("admin_reauth_password", "")
        if request.user.check_password(password):
            # Rotate the session key without logging out of the main NexusAI app.
            request.session.cycle_key()
            request.session[ADMIN_REAUTH_SESSION_KEY] = time.time()
            return redirect(safe_next)
        error = "Incorrect password. Please try again."

    return render(request, "pages/admin_reauth.html", {
        "next": safe_next,
        "error": error,
    })

@login_required
@require_POST
def logout_view(request):
    """Invalidate the current Django session, then return to sign-in."""
    logout(request)
    return redirect("login")

# API Endpoints
def require_authenticated_json(view_func):
    """Return JSON 401 responses for unauthenticated API requests."""
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required."}, status=401)
        return view_func(request, *args, **kwargs)
    return _wrapped

@require_authenticated_json
@require_POST
def api_analyze_requirements(request):
    try:
        data = json.loads(request.body or b'{}')
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Request body must contain valid JSON.'}, status=400)
    if not isinstance(data, dict):
        return JsonResponse({'error': 'Request body must be a JSON object.'}, status=400)
    raw_prompt = data.get('rawPrompt', '')
    category = data.get('category', 'General')
    reqs = analyze_requirements_python(raw_prompt, category)
    return JsonResponse({'requirements': reqs})

@require_authenticated_json
@require_POST
def api_generate_architecture(request):
    try:
        data = json.loads(request.body or b'{}')
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Request body must contain valid JSON.'}, status=400)
    if not isinstance(data, dict):
        return JsonResponse({'error': 'Request body must be a JSON object.'}, status=400)
    summary = data.get('requirementsSummary', '')
    topo = generate_architecture_python(summary)
    return JsonResponse(topo)

@require_authenticated_json
@require_POST
def api_review_code(request):
    try:
        data = json.loads(request.body or b'{}')
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Request body must contain valid JSON.'}, status=400)
    if not isinstance(data, dict):
        return JsonResponse({'error': 'Request body must be a JSON object.'}, status=400)
    code = data.get('code', '')
    filename = data.get('filename', 'main.py')
    mode = data.get('mode', 'refactor')
    if not isinstance(code, str) or not code.strip():
        return JsonResponse({'error': 'Code is required.'}, status=400)
    res = review_code_python(code, filename, mode)
    return JsonResponse(res)

    ctx = {'register_form': RegisterForm()}
    return render(request, 'pages/register.html', ctx)