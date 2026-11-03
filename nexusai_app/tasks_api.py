import json
from datetime import date

from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods

from .models import Project, TaskItem


def task_to_dict(task):
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "assigned_agent": task.assigned_agent,
        "priority": task.priority,
        "status": task.status,
        "sprint": task.sprint,
        "due_date": task.due_date.isoformat() if task.due_date else "",
        "created_at": task.created_at.isoformat(),
    }


def read_payload(request):
    try:
        return json.loads(request.body or "{}"), None
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, JsonResponse(
            {"success": False, "message": "Invalid JSON."}, status=400
        )


@login_required
@require_http_methods(["GET", "POST"])
def project_tasks(request, project_id):
    project = get_object_or_404(Project, id=project_id, owner=request.user)

    if request.method == "GET":
        tasks = TaskItem.objects.filter(project=project).order_by("-created_at")
        return JsonResponse({
            "success": True,
            "tasks": [task_to_dict(task) for task in tasks],
        })

    data, error = read_payload(request)
    if error:
        return error

    title = str(data.get("title", "")).strip()
    if not title:
        return JsonResponse(
            {"success": False, "message": "Task title is required."}, status=400
        )

    priority = data.get("priority", "medium")
    status = data.get("status", "backlog")
    if priority not in dict(TaskItem.PRIORITY_CHOICES):
        return JsonResponse({"success": False, "message": "Invalid priority."}, status=400)
    if status not in dict(TaskItem.STATUS_CHOICES):
        return JsonResponse({"success": False, "message": "Invalid status."}, status=400)

    due_date_value = str(data.get("due_date", "")).strip()
    try:
        due_date = date.fromisoformat(due_date_value) if due_date_value else None
    except ValueError:
        return JsonResponse({"success": False, "message": "Due date must be YYYY-MM-DD."}, status=400)

    task = TaskItem.objects.create(
        project=project,
        title=title[:255],
        description=str(data.get("description", "")).strip(),
        assigned_agent=str(data.get("assigned_agent", "")).strip()[:100] or "Unassigned",
        priority=priority,
        status=status,
        sprint=str(data.get("sprint", "Sprint 1")).strip()[:100] or "Sprint 1",
        due_date=due_date,
    )
    return JsonResponse({"success": True, "task": task_to_dict(task)}, status=201)


@login_required
@require_http_methods(["PATCH", "DELETE"])
def update_task(request, project_id, task_id):
    project = get_object_or_404(Project, id=project_id, owner=request.user)
    task = get_object_or_404(TaskItem, id=task_id, project=project)

    if request.method == "DELETE":
        task.delete()
        return JsonResponse({"success": True, "deleted_id": task_id})

    data, error = read_payload(request)
    if error:
        return error

    if "title" in data:
        title = str(data["title"]).strip()
        if not title:
            return JsonResponse({"success": False, "message": "Task title is required."}, status=400)
        task.title = title[:255]
    if "description" in data:
        task.description = str(data["description"]).strip()
    if "assigned_agent" in data:
        task.assigned_agent = str(data["assigned_agent"]).strip()[:100] or "Unassigned"
    if "sprint" in data:
        task.sprint = str(data["sprint"]).strip()[:100] or "Sprint 1"
    if "priority" in data:
        if data["priority"] not in dict(TaskItem.PRIORITY_CHOICES):
            return JsonResponse({"success": False, "message": "Invalid priority."}, status=400)
        task.priority = data["priority"]
    if "status" in data:
        if data["status"] not in dict(TaskItem.STATUS_CHOICES):
            return JsonResponse({"success": False, "message": "Invalid task status."}, status=400)
        task.status = data["status"]
    if "due_date" in data:
        due_date_value = str(data["due_date"] or "").strip()
        try:
            task.due_date = date.fromisoformat(due_date_value) if due_date_value else None
        except ValueError:
            return JsonResponse({"success": False, "message": "Due date must be YYYY-MM-DD."}, status=400)

    task.save()
    return JsonResponse({"success": True, "task": task_to_dict(task)})
