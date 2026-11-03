import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import CodeFile, Project

def _error(message, status=400):
    return JsonResponse({"success": False, "error": message}, status=status)

def _owned_project(request, project_id):
    if not request.user.is_authenticated:
        return None
    return Project.objects.filter(id=project_id, owner=request.user).first()

@require_http_methods(["GET", "POST"])
def project_code_files(request, project_id):
    if not request.user.is_authenticated:
        return _error("Please sign in first.", 401)
    project = _owned_project(request, project_id)
    if not project:
        return _error("Project not found or access denied.", 404)

    if request.method == "GET":
        files = CodeFile.objects.filter(project=project).order_by("path", "name")
        return JsonResponse({"success": True, "files": [{
            "id": item.id, "name": item.name, "path": item.path,
            "language": item.language, "content": item.content,
            "is_modified": item.is_modified
        } for item in files]})

    try:
        data = json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return _error("Invalid JSON request.")

    name = str(data.get("name", "")).strip()
    content = data.get("content")
    language = str(data.get("language", "text")).strip().lower()
    path = str(data.get("path", name)).strip() or name

    if not name or not isinstance(content, str) or not content.strip():
        return _error("File name and code content are required.")
    if len(name) > 255 or len(path) > 500 or len(content) > 1000000:
        return _error("File name, path or content is too large.")
    if any(part in name for part in ("/", "\\", "..")):
        return _error("Enter a filename without folder paths.")

    item, created = CodeFile.objects.update_or_create(
        project=project, path=path,
        defaults={"name": name, "language": language[:50] or "text",
                  "content": content, "is_modified": False}
    )
    return JsonResponse({"success": True, "created": created,
        "file": {"id": item.id, "name": item.name, "path": item.path,
                 "language": item.language},
        "message": "Code file saved successfully."}, status=201 if created else 200)

@require_http_methods(["GET"])
def project_code_file_detail(request, project_id, file_id):
    if not request.user.is_authenticated:
        return _error("Please sign in first.", 401)
    project = _owned_project(request, project_id)
    if not project:
        return _error("Project not found or access denied.", 404)
    item = CodeFile.objects.filter(project=project, id=file_id).first()
    if not item:
        return _error("Code file not found.", 404)
    return JsonResponse({"success": True, "file": {
        "id": item.id, "name": item.name, "path": item.path,
        "language": item.language, "content": item.content
    }})