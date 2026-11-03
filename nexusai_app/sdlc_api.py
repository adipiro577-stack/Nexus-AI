import json

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .models import (
    Project, Requirement, ArchNode, DatabaseTable, ProjectDatabaseDesign,
    CodeFile, TestCase, TaskItem, ProjectAnalysis
)


@login_required
@require_GET
def sdlc_overview(request):
    """Return real, owner-scoped SDLC and sprint data for the selected project."""
    projects = Project.objects.filter(owner=request.user).order_by("-updated_at")
    project_rows = [{"id": p.id, "name": p.name, "status": p.status}
                    for p in projects]

    raw_project_id = request.GET.get("project_id")
    if raw_project_id:
        try:
            project = projects.get(id=int(raw_project_id))
        except (ValueError, Project.DoesNotExist):
            return JsonResponse(
                {"success": False, "message": "Project not found or access denied."},
                status=404
            )
    else:
        project = projects.first()

    if not project:
        return JsonResponse({
            "success": True, "projects": project_rows, "selected_project": None,
            "stages": [], "tasks": {
                "total": 0, "backlog": 0, "in_progress": 0,
                "review": 0, "completed": 0, "completion_rate": 0
            }
        })

    req_count = Requirement.objects.filter(project=project).count()
    arch_count = ArchNode.objects.filter(project=project).count()
    db_count = (
        DatabaseTable.objects.filter(project=project).count()
        + (1 if ProjectDatabaseDesign.objects.filter(project=project).exists() else 0)
    )
    code_count = CodeFile.objects.filter(project=project).count()
    tests = TestCase.objects.filter(project=project)
    test_count = tests.count()
    passed_tests = tests.filter(status__iexact="passed").count()
    failed_tests = tests.filter(status__iexact="failed").count()
    analysis_count = ProjectAnalysis.objects.filter(project=project).count()

    # Stage completion is based on persisted project artifacts, not Project.progress.
    stage_data = [
        ("Idea", True, "Project record exists"),
        ("Specs", req_count > 0, f"{req_count} saved requirements"),
        ("Architecture", arch_count > 0, f"{arch_count} saved architecture nodes"),
        ("Database", db_count > 0, f"{db_count} saved database design/table records"),
        ("Code", code_count > 0, f"{code_count} saved code files"),
        ("Testing", test_count > 0, f"{test_count} saved test cases"),
        ("Review", test_count > 0 and failed_tests == 0 and passed_tests == test_count,
         f"{passed_tests}/{test_count} tests passed" if test_count else "No test results yet"),
        ("Docs", analysis_count > 0, f"{analysis_count} saved project analyses")
    ]

    first_incomplete = next((i for i, row in enumerate(stage_data) if not row[1]), None)
    stages = []
    for i, (name, complete, detail) in enumerate(stage_data):
        if complete:
            status = "completed"
        elif first_incomplete == i:
            status = "in_progress"
        else:
            status = "pending"
        stages.append({
            "number": i + 1, "name": name, "status": status,
            "completed": complete, "detail": detail
        })

    tasks = TaskItem.objects.filter(project=project)
    total = tasks.count()
    backlog = tasks.filter(status="backlog").count()
    in_progress = tasks.filter(status="in-progress").count()
    review = tasks.filter(status="review").count()
    completed = tasks.filter(status="completed").count()

    return JsonResponse({
        "success": True,
        "projects": project_rows,
        "selected_project": {"id": project.id, "name": project.name},
        "stages": stages,
        "current_stage": (first_incomplete + 1) if first_incomplete is not None else 8,
        "all_stages_complete": first_incomplete is None,
        "tasks": {
            "total": total, "backlog": backlog, "in_progress": in_progress,
            "review": review, "completed": completed,
            "completion_rate": round(completed * 100 / total, 1) if total else 0
        }
    })
