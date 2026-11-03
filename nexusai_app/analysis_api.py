
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Project, ProjectAnalysis, Requirement
from .serializers import ProjectAnalysisSerializer


def normalize_requirement_title(title):
    """Normalize titles for duplicate detection within one project."""
    return " ".join(title.casefold().split())


@api_view(["GET", "POST"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def project_analysis_list_create(request, project_id):

    # Only the project owner can access this project's analysis history.
    project = get_object_or_404(
        Project,
        pk=project_id,
        owner=request.user,
    )

    # List all saved analyses.
    if request.method == "GET":
        analyses = ProjectAnalysis.objects.filter(
            project=project
        ).select_related("created_by")

        serializer = ProjectAnalysisSerializer(analyses, many=True)

        return Response({
            "success": True,
            "analyses": serializer.data,
        })

    # Validate original prompt.
    prompt = request.data.get("prompt")

    if not isinstance(prompt, str) or not prompt.strip():
        return Response(
            {"success": False, "error": "Original prompt is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(prompt) > 20000:
        return Response(
            {"success": False, "error": "Prompt is too large."},
            status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )

    # Validate generated requirements.
    requirements = request.data.get("requirements")

    if not isinstance(requirements, list) or not requirements:
        return Response(
            {"success": False, "error": "Generated requirements are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(requirements) > 20:
        return Response(
            {"success": False, "error": "Too many requirements."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    valid_priorities = {"high", "medium", "low"}
    valid_types = {
        "functional",
        "non-functional",
        "security",
        "integration",
    }
    valid_complexities = {"Low", "Medium", "High"}

    cleaned_requirements = []

    for index, item in enumerate(requirements):
        if not isinstance(item, dict):
            return Response(
                {"success": False, "error": f"Invalid requirement at position {index + 1}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        title = item.get("title")
        description = item.get("description")

        if not isinstance(title, str) or not title.strip():
            return Response(
                {"success": False, "error": f"Requirement {index + 1} needs a title."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(description, str) or not description.strip():
            return Response(
                {"success": False, "error": f"Requirement {index + 1} needs a description."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(title) > 255 or len(description) > 10000:
            return Response(
                {"success": False, "error": f"Requirement {index + 1} is too long."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        priority = str(item.get("priority", "medium")).lower()
        req_type = str(item.get("type", "functional")).lower()
        complexity = str(item.get("complexity", "Medium"))

        if priority not in valid_priorities or req_type not in valid_types:
            return Response(
                {"success": False, "error": f"Invalid priority or type in requirement {index + 1}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if complexity not in valid_complexities:
            complexity = "Medium"

        cleaned_requirements.append({
            "id": str(item.get("id", f"req-{index + 1}")),
            "title": title.strip(),
            "description": description.strip(),
            "priority": priority,
            "type": req_type,
            "status": "extracted",
            "complexity": complexity,
        })

    # Validate Gemini thinking summaries.
    thinking_summaries = request.data.get("thinking_summaries", [])

    if not isinstance(thinking_summaries, list) or len(thinking_summaries) > 50:
        return Response(
            {"success": False, "error": "Invalid thinking summaries."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if any(
        not isinstance(item, str) or len(item) > 10000
        for item in thinking_summaries
    ):
        return Response(
            {"success": False, "error": "Invalid thinking summary content."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    category = request.data.get("category", project.category)
    if not isinstance(category, str):
        category = project.category

    title = request.data.get("title")
    if not isinstance(title, str) or not title.strip():
        title = f"Requirements Analysis - {timezone.localtime().strftime('%Y-%m-%d %H:%M')}"

    title = title.strip()[:255]

    provider = request.data.get("provider", "Google Gemini")
    model = request.data.get("model", "gemini-3.8-flash")

    if not isinstance(provider, str) or not isinstance(model, str):
        return Response(
            {"success": False, "error": "Invalid AI provider information."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Save analysis and import requirements atomically.
    # If anything fails, the complete transaction is rolled back.
    with transaction.atomic():

        analysis = ProjectAnalysis.objects.create(
            project=project,
            created_by=request.user,
            title=title,
            prompt=prompt.strip(),
            category=category[:100],
            provider=provider[:50],
            model=model[:100],
            thinking_summaries=thinking_summaries,
            requirements_snapshot=cleaned_requirements,
        )

        existing_requirements = Requirement.objects.filter(
            project=project
        )

        existing_by_title = {}

        for existing in existing_requirements:
            key = normalize_requirement_title(existing.title)
            existing_by_title.setdefault(key, existing)

        created_ids = []
        duplicate_records = []

        for item in cleaned_requirements:
            key = normalize_requirement_title(item["title"])

            existing = existing_by_title.get(key)

            if existing:
                duplicate_records.append({
                    "title": item["title"],
                    "requirement_id": existing.id,
                })
                continue

            new_requirement = Requirement.objects.create(
                project=project,
                source_analysis=analysis,
                title=item["title"],
                description=item["description"],
                priority=item["priority"],
                req_type=item["type"],
                status="extracted",
                complexity=item["complexity"],
            )

            existing_by_title[key] = new_requirement
            created_ids.append(new_requirement.id)

        import_summary = {
            "generated_count": len(cleaned_requirements),
            "created_count": len(created_ids),
            "duplicate_count": len(duplicate_records),
            "created_requirement_ids": created_ids,
            "duplicates": duplicate_records,
        }

        analysis.import_summary = import_summary
        analysis.save(update_fields=["import_summary"])

    return Response({
        "success": True,
        "message": "Analysis saved and requirements imported successfully.",
        "analysis": ProjectAnalysisSerializer(analysis).data,
        "import_summary": import_summary,
    }, status=status.HTTP_201_CREATED)


@api_view(["GET", "DELETE"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def project_analysis_detail(request, project_id, analysis_id):

    project = get_object_or_404(
        Project,
        pk=project_id,
        owner=request.user,
    )

    analysis = get_object_or_404(
        ProjectAnalysis,
        pk=analysis_id,
        project=project,
    )

    if request.method == "GET":
        serializer = ProjectAnalysisSerializer(analysis)

        return Response({
            "success": True,
            "analysis": serializer.data,
        })

    # SET_NULL preserves imported requirements if history is deleted.
    analysis.delete()

    return Response({
        "success": True,
        "message": "Analysis history deleted. Imported requirements were preserved.",
    })
