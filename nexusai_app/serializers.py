from rest_framework import serializers
from .models import Project, ProjectAnalysis, Requirement


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "category",
            "status",
            "progress",
            "tech_stack",
            "repo_url",
            "owner",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "owner",
            "created_at",
            "updated_at",
        ]

    def validate_progress(self, value):
        if not 0 <= value <= 100:
            raise serializers.ValidationError(
                "Progress must be between 0 and 100."
            )
        return value


class ProjectAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectAnalysis
        fields = [
            "id",
            "project",
            "created_by",
            "title",
            "prompt",
            "category",
            "provider",
            "model",
            "thinking_summaries",
            "requirements_snapshot",
            "import_summary",
            "created_at",
        ]
        read_only_fields = fields


class RequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Requirement
        fields = [
            "id",
            "project",
            "source_analysis",
            "title",
            "description",
            "priority",
            "req_type",
            "status",
            "complexity",
            "created_at",
        ]
        read_only_fields = ["id", "project", "source_analysis", "created_at"]
