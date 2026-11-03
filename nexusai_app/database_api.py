import re

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Project, ProjectDatabaseDesign

NAME_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9_]{0,79}$")
MAX_TABLES = 12
MAX_COLUMNS = 30
ALLOWED_FIELD_TYPES = {
    "AutoField", "BigAutoField", "UUIDField", "CharField", "TextField",
    "EmailField", "URLField", "SlugField", "IntegerField", "BigIntegerField",
    "PositiveIntegerField", "BooleanField", "DateField", "DateTimeField",
    "TimeField", "DecimalField", "FloatField", "DurationField", "JSONField",
    "ForeignKey", "OneToOneField", "ManyToManyField", "FileField", "ImageField",
}


def _serialize(design):
    return {
        "id": design.id,
        "project_id": design.project_id,
        "provider": design.provider,
        "model": design.model,
        "tables": design.tables,
        "django_models": design.django_models,
        "created_at": design.created_at,
        "updated_at": design.updated_at,
    }


@api_view(["GET", "PUT"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def project_database_design(request, project_id):
    project = get_object_or_404(Project, pk=project_id, owner=request.user)

    if request.method == "GET":
        design = ProjectDatabaseDesign.objects.filter(project=project).first()
        return Response({"success": True, "design": _serialize(design) if design else None})

    raw_tables = request.data.get("tables")
    django_models = request.data.get("django_models", "")
    provider = str(request.data.get("provider", "AI"))[:50]
    model = str(request.data.get("model", "unknown"))[:120]

    if not isinstance(raw_tables, list) or not 3 <= len(raw_tables) <= MAX_TABLES:
        return Response({"success": False, "detail": f"Database design must contain between 3 and {MAX_TABLES} tables."}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(django_models, str) or len(django_models) > 50000:
        return Response({"success": False, "detail": "Django model code is invalid or too large."}, status=status.HTTP_400_BAD_REQUEST)

    clean_tables = []
    table_names = set()
    for table in raw_tables:
        if not isinstance(table, dict):
            return Response({"success": False, "detail": "Each table must be an object."}, status=400)
        name = str(table.get("name", "")).strip()
        if not NAME_PATTERN.fullmatch(name) or name.lower() in table_names:
            return Response({"success": False, "detail": "Table names must be unique Python identifiers beginning with a letter."}, status=400)
        columns = table.get("columns")
        if not isinstance(columns, list) or not 1 <= len(columns) <= MAX_COLUMNS:
            return Response({"success": False, "detail": f"Table {name} must contain between 1 and {MAX_COLUMNS} columns."}, status=400)
        clean_columns = []
        column_names = set()
        for column in columns:
            if not isinstance(column, dict):
                return Response({"success": False, "detail": f"Invalid column in table {name}."}, status=400)
            column_name = str(column.get("name", "")).strip()
            field_type = str(column.get("type", "CharField"))
            if not NAME_PATTERN.fullmatch(column_name) or column_name.lower() in column_names:
                return Response({"success": False, "detail": f"Column names in {name} must be unique Python identifiers."}, status=400)
            if field_type not in ALLOWED_FIELD_TYPES:
                return Response({"success": False, "detail": f"Unsupported Django field type: {field_type}."}, status=400)
            foreign_key = column.get("foreign_key")
            if foreign_key is not None:
                foreign_key = str(foreign_key).strip()[:100] or None
            clean_columns.append({
                "name": column_name,
                "type": field_type,
                "primary_key": bool(column.get("primary_key", False)),
                "nullable": bool(column.get("nullable", True)),
                "foreign_key": foreign_key,
            })
            column_names.add(column_name.lower())
        clean_tables.append({
            "name": name,
            "description": str(table.get("description", ""))[:1000],
            "columns": clean_columns,
        })
        table_names.add(name.lower())

    with transaction.atomic():
        design, _created = ProjectDatabaseDesign.objects.update_or_create(
            project=project,
            defaults={
                "created_by": request.user,
                "provider": provider or "AI",
                "model": model or "unknown",
                "tables": clean_tables,
                "django_models": django_models,
            },
        )

    return Response({"success": True, "message": "Database design saved successfully.", "design": _serialize(design)}, status=status.HTTP_200_OK)
