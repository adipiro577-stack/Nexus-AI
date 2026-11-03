from datetime import timedelta

from django.contrib.auth.decorators import login_required
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.http import JsonResponse
from django.utils import timezone

from .models import (
    Project, Requirement, ArchNode, ArchConnection, TaskItem,
    CodeFile, DatabaseTable, ProjectAnalysis, TestCase, CiCdPipeline
)


@login_required
def telemetry_overview(request):
    """Return live analytics limited to the signed-in user's projects."""
    projects = Project.objects.filter(owner=request.user)
    project_ids = projects.values_list("id", flat=True)
    project_id = request.GET.get("project_id")

    if project_id:
        try:
            selected_id = int(project_id)
        except (TypeError, ValueError):
            return JsonResponse({"success": False, "message": "Invalid project_id."}, status=400)
        if not projects.filter(id=selected_id).exists():
            return JsonResponse({"success": False, "message": "Project not found."}, status=404)
        projects = projects.filter(id=selected_id)
        project_ids = projects.values_list("id", flat=True)

    tasks = TaskItem.objects.filter(project_id__in=project_ids)
    requirements = Requirement.objects.filter(project_id__in=project_ids)
    nodes = ArchNode.objects.filter(project_id__in=project_ids)
    connections = ArchConnection.objects.filter(project_id__in=project_ids)
    code_files = CodeFile.objects.filter(project_id__in=project_ids)
    tables = DatabaseTable.objects.filter(project_id__in=project_ids)
    analyses = ProjectAnalysis.objects.filter(project_id__in=project_ids)
    tests = TestCase.objects.filter(project_id__in=project_ids)

    def count_status(queryset, field, values):
        return {value: queryset.filter(**{field: value}).count() for value in values}

    today = timezone.localdate()
    start = today - timedelta(days=13)
    project_daily = {
        row["day"].isoformat(): row["total"]
        for row in projects.filter(created_at__date__gte=start)
        .annotate(day=TruncDate("created_at")).values("day")
        .annotate(total=Count("id")).order_by("day")
    }
    task_daily = {
        row["day"].isoformat(): row["total"]
        for row in tasks.filter(created_at__date__gte=start)
        .annotate(day=TruncDate("created_at")).values("day")
        .annotate(total=Count("id")).order_by("day")
    }
    days = [(start + timedelta(days=i)).isoformat() for i in range(14)]

    return JsonResponse({
        "success": True,
        "generated_at": timezone.now().isoformat(),
        "scope": "project" if project_id else "all_user_projects",
        "projects": [{"id": p.id, "name": p.name, "status": p.status, "progress": p.progress}
                     for p in projects.order_by("name")],
        "metrics": {
            "projects": projects.count(),
            "requirements": requirements.count(),
            "architecture_nodes": nodes.count(),
            "architecture_connections": connections.count(),
            "tasks": tasks.count(),
            "code_files": code_files.count(),
            "database_tables": tables.count(),
            "ai_analyses": analyses.count(),
            "tests": tests.count(),
            "task_status": count_status(tasks, "status", ["backlog", "in-progress", "review", "completed"]),
            "project_status": count_status(projects, "status", ["planning", "active", "testing", "deployed"]),
            "test_status": count_status(tests, "status", ["passed", "failed", "running"]),
        },
        "timeline": {
            "labels": days,
            "projects_created": [project_daily.get(day, 0) for day in days],
            "tasks_created": [task_daily.get(day, 0) for day in days],
        },
        "limitations": [
            "AI provider token usage and individual swarm execution history are not persisted in the current database, so they are not represented as measured analytics."
        ],
    })
