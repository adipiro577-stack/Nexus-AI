
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from rest_framework.test import APIClient

from nexusai_app.models import Project, ProjectAnalysis, Requirement


User = get_user_model()


class ProjectAnalysisApiTests(TestCase):

    def setUp(self):
        self.owner = User.objects.create_user(
            username="analysisowner",
            email="analysisowner@example.com",
            password="Strong-test-password!123",
        )

        self.other_user = User.objects.create_user(
            username="analysisother",
            email="analysisother@example.com",
            password="Strong-test-password!123",
        )

        self.project = Project.objects.create(
            name="Jewellery Employee Management",
            description="Manage jewellery store employees.",
            category="Business",
            owner=self.owner,
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.owner)

        self.list_url = reverse(
            "project_analysis_list_create",
            args=[self.project.pk],
        )

    def sample_payload(self):
        return {
            "title": "Employee Management Analysis",
            "prompt": "Create a Jewellery Employee Management System.",
            "category": "Business",
            "provider": "Google Gemini",
            "model": "gemini-3.8-flash",
            "thinking_summaries": [
                "Identifying employee management requirements.",
                "Reviewing attendance and payroll features.",
            ],
            "requirements": [
                {
                    "id": "req-1",
                    "title": "Employee Profile Management",
                    "description": "Manage employee details and roles.",
                    "priority": "high",
                    "type": "functional",
                    "complexity": "Medium",
                },
                {
                    "id": "req-2",
                    "title": "Employee Attendance",
                    "description": "Track attendance and working hours.",
                    "priority": "medium",
                    "type": "functional",
                    "complexity": "Low",
                },
            ],
        }

    def test_save_analysis_and_import_requirements(self):
        response = self.client.post(
            self.list_url,
            self.sample_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.content)

        self.assertEqual(ProjectAnalysis.objects.count(), 1)
        self.assertEqual(
            Requirement.objects.filter(project=self.project).count(),
            2,
        )

        analysis = ProjectAnalysis.objects.get()

        self.assertEqual(analysis.created_by, self.owner)
        self.assertEqual(analysis.project, self.project)
        self.assertEqual(len(analysis.thinking_summaries), 2)
        self.assertEqual(len(analysis.requirements_snapshot), 2)

        imported = Requirement.objects.filter(
            project=self.project,
            source_analysis=analysis,
        )

        self.assertEqual(imported.count(), 2)

        self.assertEqual(response.data["import_summary"]["created_count"], 2)
        self.assertEqual(response.data["import_summary"]["duplicate_count"], 0)

    def test_duplicate_requirement_titles_are_not_imported_twice(self):
        Requirement.objects.create(
            project=self.project,
            title="Employee Profile Management",
            description="Existing requirement.",
            priority="high",
            req_type="functional",
        )

        payload = self.sample_payload()

        payload["requirements"][0]["title"] = (
            "  EMPLOYEE   PROFILE MANAGEMENT  "
        )

        response = self.client.post(
            self.list_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.content)

        self.assertEqual(ProjectAnalysis.objects.count(), 1)
        self.assertEqual(Requirement.objects.filter(project=self.project).count(), 2)

        self.assertEqual(response.data["import_summary"]["created_count"], 1)
        self.assertEqual(response.data["import_summary"]["duplicate_count"], 1)

    def test_analysis_history_can_be_listed_and_reopened(self):
        response = self.client.post(
            self.list_url,
            self.sample_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.content)

        analysis_id = response.data["analysis"]["id"]

        list_response = self.client.get(self.list_url)

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data["analyses"]), 1)

        detail_url = reverse(
            "project_analysis_detail",
            args=[self.project.pk, analysis_id],
        )

        detail_response = self.client.get(detail_url)

        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(
            detail_response.data["analysis"]["prompt"],
            self.sample_payload()["prompt"],
        )

    def test_other_user_cannot_access_project_analysis(self):
        response = self.client.post(
            self.list_url,
            self.sample_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.content)

        analysis_id = response.data["analysis"]["id"]

        other_client = APIClient()
        other_client.force_authenticate(user=self.other_user)

        list_response = other_client.get(self.list_url)

        self.assertEqual(list_response.status_code, 404)

        detail_url = reverse(
            "project_analysis_detail",
            args=[self.project.pk, analysis_id],
        )

        detail_response = other_client.get(detail_url)

        self.assertEqual(detail_response.status_code, 404)

        save_response = other_client.post(
            self.list_url,
            self.sample_payload(),
            format="json",
        )

        self.assertEqual(save_response.status_code, 404)

        self.assertEqual(ProjectAnalysis.objects.count(), 1)

    def test_deleting_analysis_preserves_imported_requirements(self):
        response = self.client.post(
            self.list_url,
            self.sample_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.content)

        analysis_id = response.data["analysis"]["id"]

        imported_ids = list(
            Requirement.objects.filter(
                source_analysis_id=analysis_id
            ).values_list("id", flat=True)
        )

        detail_url = reverse(
            "project_analysis_detail",
            args=[self.project.pk, analysis_id],
        )

        delete_response = self.client.delete(detail_url)

        self.assertEqual(delete_response.status_code, 200)

        self.assertFalse(
            ProjectAnalysis.objects.filter(pk=analysis_id).exists()
        )

        remaining = Requirement.objects.filter(id__in=imported_ids)

        self.assertEqual(remaining.count(), 2)
        self.assertEqual(remaining.filter(source_analysis__isnull=True).count(), 2)

    def test_anonymous_user_cannot_access_analysis_history(self):
        anonymous_client = APIClient()

        response = anonymous_client.get(self.list_url)

        self.assertIn(response.status_code, [401, 403])
