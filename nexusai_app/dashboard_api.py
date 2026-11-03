from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

from .models import (
    Project, Requirement, ArchNode, AgentInfo, TestCase, TaskItem,
    DatabaseTable, CodeFile, ProjectDatabaseDesign
)


@login_required
def dashboard_summary(request):
    projects = Project.objects.filter(owner=request.user)
    project_ids = projects.values_list("id", flat=True)

    requirements = Requirement.objects.filter(project_id__in=project_ids)
    nodes = ArchNode.objects.filter(project_id__in=project_ids)
    tasks = TaskItem.objects.filter(project_id__in=project_ids)
    tests = TestCase.objects.filter(project_id__in=project_ids)
    tables = DatabaseTable.objects.filter(project_id__in=project_ids)
    code_files = CodeFile.objects.filter(project_id__in=project_ids)
    database_designs = ProjectDatabaseDesign.objects.filter(project_id__in=project_ids)

    
    total_tasks = tasks.count()
    backlog_tasks = tasks.filter(status="backlog").count()
    in_progress_tasks = tasks.filter(status="in-progress").count()
    review_tasks = tasks.filter(status="review").count()
    completed_tasks = tasks.filter(status="completed").count()

    task_completion_rate = (
        round(completed_tasks * 100 / total_tasks, 1)
        if total_tasks else 0
    )

    total_tests = tests.count()
    passed_tests = tests.filter(status__iexact="passed").count()
    failed_tests = tests.filter(status__iexact="failed").count()
    running_tests = tests.filter(status__iexact="running").count()

    audit_rate = (
    round(passed_tests * 100 / total_tests, 1)
    if total_tests and not running_tests
    else None
    )
    total_projects = projects.count()
    planning_projects = projects.filter(status__iexact="planning").count()
    active_projects = projects.filter(status__iexact="active").count()
    testing_projects = projects.filter(status__iexact="testing").count()
    deployed_projects = projects.filter(status__iexact="deployed").count()
    average_progress = round(
        sum(max(0, min(100, int(value or 0))) for value in projects.values_list("progress", flat=True)) / total_projects
    ) if total_projects else 0

    return JsonResponse({
        "success": True,
        "metrics": {
            "projects": total_projects,
            "planning_projects": planning_projects,
            "active_projects": active_projects,
            "testing_projects": testing_projects,
            "deployed_projects": deployed_projects,
            "agents": AgentInfo.objects.count(),
            "requirements": requirements.count(),
            "topology_nodes": nodes.count(),
            "database_designs": database_designs.count(),
            "database_tables": tables.count(),
            "code_files": code_files.count(),
            "tasks": total_tasks,
            "backlog_tasks": backlog_tasks,
            "in_progress_tasks": in_progress_tasks,
            "review_tasks": review_tasks,
            "completed_tasks": completed_tasks,
            "task_completion_rate": task_completion_rate,
            "security_audit_rate": audit_rate,
            "tests_total": total_tests,
            "tests_passed": passed_tests,
            "tests_failed": failed_tests,
            "tests_running": running_tests,
            "average_progress": average_progress,
        },
    })
