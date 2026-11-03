from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from nexusai_app.models import Project, Requirement

User = get_user_model()


class ProjectRequirementsApiTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="reqowner", email="reqowner@example.com", password="Strong-test-password!123"
        )
        self.other = User.objects.create_user(
            username="reqother", email="reqother@example.com", password="Strong-test-password!123"
        )
        self.project = Project.objects.create(
            name="Demo Project", description="Demo", category="General", owner=self.owner
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.owner)
        self.list_url = reverse("project_requirement_list_create", args=[self.project.pk])

    def payload(self):
        return {
            "title": "User Login",
            "description": "Allow registered users to sign in securely.",
            "priority": "high",
            "req_type": "security",
            "status": "extracted",
            "complexity": "Medium",
        }

    def test_create_list_update_and_delete_requirement(self):
        created = self.client.post(self.list_url, self.payload(), format="json")
        self.assertEqual(created.status_code, 201, created.content)
        requirement_id = created.data["requirement"]["id"]
        self.assertEqual(Requirement.objects.filter(project=self.project).count(), 1)

        listed = self.client.get(self.list_url)
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.data["requirements"]), 1)

        detail_url = reverse(
            "project_requirement_detail", args=[self.project.pk, requirement_id]
        )
        updated = self.client.patch(
            detail_url, {"priority": "low", "status": "approved", "title": "Secure User Login"},
            format="json"
        )
        self.assertEqual(updated.status_code, 200, updated.content)
        requirement = Requirement.objects.get(pk=requirement_id)
        self.assertEqual(requirement.priority, "low")
        self.assertEqual(requirement.status, "approved")
        self.assertEqual(requirement.title, "Secure User Login")

        deleted = self.client.delete(detail_url)
        self.assertEqual(deleted.status_code, 200)
        self.assertFalse(Requirement.objects.filter(pk=requirement_id).exists())

    def test_invalid_choice_is_rejected(self):
        payload = self.payload()
        payload["status"] = "invented-status"
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, 400)

    def test_other_user_cannot_read_or_modify_project_requirements(self):
        requirement = Requirement.objects.create(
            project=self.project, title="Private requirement", description="Private"
        )
        other_client = APIClient()
        other_client.force_authenticate(user=self.other)
        self.assertEqual(other_client.get(self.list_url).status_code, 404)
        detail_url = reverse(
            "project_requirement_detail", args=[self.project.pk, requirement.pk]
        )
        self.assertEqual(other_client.patch(detail_url, {"title": "Stolen"}, format="json").status_code, 404)
        self.assertEqual(other_client.delete(detail_url).status_code, 404)
        requirement.refresh_from_db()
        self.assertEqual(requirement.title, "Private requirement")

    def test_anonymous_user_is_denied(self):
        anonymous = APIClient()
        self.assertIn(anonymous.get(self.list_url).status_code, (401, 403))
