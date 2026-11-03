from rest_framework import permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count

from .models import Project, SystemSetting
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Never expose another user's projects. Ownerless legacy records are
        # intentionally excluded until explicitly assigned by an administrator.
        return Project.objects.filter(owner=self.request.user).order_by("-updated_at", "-id")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def project_workspace_summary(request):
    queryset = Project.objects.filter(owner=request.user)
    status_counts = {row["status"]: row["total"] for row in queryset.values("status").annotate(total=Count("id"))}
    return Response({
        "total": queryset.count(),
        "status_counts": status_counts,
        "projects": ProjectSerializer(queryset.order_by("-updated_at", "-id"), many=True).data,
    })


@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def user_system_settings(request):
    """Read and persist the signed-in user's NexusAI system preferences."""
    defaults = {"primary_model": "gemini-3.6-flash", "temperature": 0.2, "max_tokens": 8192}
    keys = {name: f"user:{request.user.pk}:settings:{name}" for name in defaults}

    if request.method == "GET":
        values = {}
        for name, default in defaults.items():
            row = SystemSetting.objects.filter(key=keys[name]).first()
            raw = row.value if row else default
            try:
                values[name] = float(raw) if name == "temperature" else (int(raw) if name == "max_tokens" else str(raw))
            except (TypeError, ValueError):
                values[name] = default
        return Response({"success": True, "settings": values})

    incoming = request.data if isinstance(request.data, dict) else {}
    values = {}
    model = str(incoming.get("primary_model", defaults["primary_model"])).strip()[:120]
    if not model:
        return Response({"success": False, "detail": "Primary model is required."}, status=400)
    try:
        temperature = float(incoming.get("temperature", defaults["temperature"]))
        max_tokens = int(incoming.get("max_tokens", defaults["max_tokens"]))
    except (TypeError, ValueError):
        return Response({"success": False, "detail": "Temperature and max tokens must be numeric."}, status=400)
    if not 0 <= temperature <= 1 or not 256 <= max_tokens <= 131072:
        return Response({"success": False, "detail": "Temperature must be 0–1 and max tokens 256–131072."}, status=400)
    values.update(primary_model=model, temperature=temperature, max_tokens=max_tokens)
    for name, value in values.items():
        SystemSetting.objects.update_or_create(key=keys[name], defaults={"value": str(value)})
    return Response({"success": True, "settings": values, "message": "Settings saved."})
