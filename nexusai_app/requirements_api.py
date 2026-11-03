from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Project, Requirement
from .serializers import RequirementSerializer


@api_view(["GET", "POST"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def project_requirement_list_create(request, project_id):
    project = get_object_or_404(Project, pk=project_id, owner=request.user)

    if request.method == "GET":
        requirements = Requirement.objects.filter(project=project).order_by("-created_at")
        return Response({
            "success": True,
            "requirements": RequirementSerializer(requirements, many=True).data,
        })

    serializer = RequirementSerializer(data=request.data)
    if serializer.is_valid():
        requirement = serializer.save(project=project)
        return Response({
            "success": True,
            "message": "Requirement created successfully.",
            "requirement": RequirementSerializer(requirement).data,
        }, status=status.HTTP_201_CREATED)

    return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH", "DELETE"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def project_requirement_detail(request, project_id, requirement_id):
    project = get_object_or_404(Project, pk=project_id, owner=request.user)
    requirement = get_object_or_404(Requirement, pk=requirement_id, project=project)

    if request.method == "DELETE":
        requirement.delete()
        return Response({"success": True, "message": "Requirement deleted successfully."})

    serializer = RequirementSerializer(requirement, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            "success": True,
            "message": "Requirement updated successfully.",
            "requirement": serializer.data,
        })

    return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
