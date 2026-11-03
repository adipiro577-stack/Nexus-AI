import subprocess
import sys
import time
from pathlib import Path

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_protect

from .models import CiCdPipeline, Project, NotificationItem


def _run_stage(name, command, timeout=180):
    started = time.time()
    try:
        result = subprocess.run(
            command,
            cwd=settings.BASE_DIR,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
        )
        output = ((result.stdout or "") + (result.stderr or "")).strip()
        return {
            "name": name,
            "status": "passed" if result.returncode == 0 else "failed",
            "duration_seconds": round(time.time() - started, 2),
            "exit_code": result.returncode,
            "output": output[-12000:] if output else "Command completed with no output.",
        }
    except subprocess.TimeoutExpired as exc:
        output = ((exc.stdout or "") + (exc.stderr or "")) if isinstance(exc.stdout, str) else ""
        return {"name": name, "status": "failed", "duration_seconds": round(time.time() - started, 2), "exit_code": None, "output": f"Timed out after {timeout} seconds.\n{output[-4000:]}"}
    except Exception as exc:
        return {"name": name, "status": "failed", "duration_seconds": round(time.time() - started, 2), "exit_code": None, "output": f"{type(exc).__name__}: {exc}"}


@login_required
@csrf_protect
@require_POST
def run_pipeline(request):
    import json
    started = time.time()
    try:
        payload = json.loads(request.body or "{}")
        project_id = int(payload.get("project_id", 0))
    except (ValueError, TypeError, json.JSONDecodeError):
        return JsonResponse({"success": False, "error": "A valid project_id is required."}, status=400)

    projects = Project.objects.all() if (request.user.is_staff or request.user.is_superuser) else Project.objects.filter(owner=request.user)
    try:
        project = projects.get(pk=project_id)
    except Project.DoesNotExist:
        return JsonResponse({"success": False, "error": "Project not found or access denied."}, status=404)

    base = Path(settings.BASE_DIR)
    manage_py = base / "manage.py"
    requirements = base / "requirements.txt"
    stages = []

    # These commands validate the NexusAI application environment. They do not
    # execute arbitrary commands from a project's repository URL.
    source_ok = manage_py.is_file()
    stages.append({
        "name": "Source Validation",
        "status": "passed" if source_ok else "failed",
        "duration_seconds": 0,
        "exit_code": 0 if source_ok else 1,
        "output": f"Project selected: {project.name}\nNexusAI backend entry point: {'found' if source_ok else 'manage.py not found'}\nDependency manifest: {'found' if requirements.is_file() else 'not found'}\nRepository URL: {project.repo_url or 'Not configured'}",
    })

    if source_ok:
        stages.append(_run_stage("Django System Check", [sys.executable, str(manage_py), "check"], timeout=90))
        if stages[-1]["status"] == "passed":
            stages.append(_run_stage("Automated Tests", [sys.executable, str(manage_py), "test", "nexusai_app", "--verbosity", "1"], timeout=240))
        else:
            stages.append({"name": "Automated Tests", "status": "skipped", "duration_seconds": 0, "exit_code": None, "output": "Skipped because Django System Check failed."})
    else:
        stages.extend([
            {"name": "Django System Check", "status": "skipped", "duration_seconds": 0, "exit_code": None, "output": "Skipped: manage.py not found."},
            {"name": "Automated Tests", "status": "skipped", "duration_seconds": 0, "exit_code": None, "output": "Skipped: manage.py not found."},
        ])

    passed = all(stage["status"] == "passed" for stage in stages)
    duration = round(time.time() - started, 2)
    logs = [f"[{s['status'].upper()}] {s['name']} ({s['duration_seconds']}s)\n{s['output']}" for s in stages]
    pipeline = CiCdPipeline.objects.create(
        project=project,
        name=f"{project.name} — Local Validation",
        branch="local",
        status="success" if passed else "failed",
        duration=f"{duration}s",
        triggered_by=request.user.username,
        logs=logs,
        stages=stages,
    )
    NotificationItem.objects.create(
        user=request.user,
        title=f"CI/CD {'Passed' if passed else 'Failed'}: {project.name}",
        message=f"Local validation {'passed' if passed else 'failed'} in {duration}s. {sum(1 for stage in stages if stage['status'] == 'passed')} of {len(stages)} stages passed.",
        notif_type="success" if passed else "error",
    )
    return JsonResponse({
        "success": passed,
        "pipeline_id": pipeline.id,
        "project": {"id": project.id, "name": project.name},
        "status": pipeline.status,
        "duration": pipeline.duration,
        "readiness": "VALIDATION PASSED" if passed else "CHECKS FAILED",
        "deployment_performed": False,
        "stages": stages,
        "logs": logs,
    }, status=200 if passed else 200)


@login_required
@require_POST
def pipeline_history(request):
    import json
    try:
        project_id = int(json.loads(request.body or "{}").get("project_id", 0))
    except (ValueError, TypeError, json.JSONDecodeError):
        return JsonResponse({"success": False, "error": "A valid project_id is required."}, status=400)
    projects = Project.objects.all() if (request.user.is_staff or request.user.is_superuser) else Project.objects.filter(owner=request.user)
    if not projects.filter(pk=project_id).exists():
        return JsonResponse({"success": False, "error": "Project not found or access denied."}, status=404)
    records = CiCdPipeline.objects.filter(project_id=project_id).order_by("-id")[:20]
    return JsonResponse({"success": True, "pipelines": [{
        "id": p.id, "name": p.name, "branch": p.branch, "status": p.status,
        "duration": p.duration, "triggered_by": p.triggered_by,
        "stages": p.stages or [], "logs": p.logs or [],
    } for p in records]})
