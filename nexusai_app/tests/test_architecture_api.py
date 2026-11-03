from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from nexusai_app.models import ArchConnection, ArchNode, Project

User = get_user_model()


class ProjectArchitectureApiTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="archowner", email="archowner@example.com", password="Strong-test-password!123"
        )
        self.other = User.objects.create_user(
            username="archother", email="archother@example.com", password="Strong-test-password!123"
        )
        self.project = Project.objects.create(
            name="Hospital Management System", description="Manage hospital operations.",
            category="Healthcare", owner=self.owner
        )
        self.url = reverse("project_architecture", args=[self.project.pk])
        self.client = APIClient()
        self.client.force_authenticate(user=self.owner)

    def payload(self):
        return {
            "nodes": [
                {"id": "gateway", "type": "gateway", "label": "API Gateway", "sublabel": "Routing", "x": 160, "y": 120},
                {"id": "patients", "type": "service", "label": "Patient Service", "sublabel": "Patient records", "x": 490, "y": 120},
                {"id": "database", "type": "database", "label": "Hospital Database", "sublabel": "Clinical data", "x": 820, "y": 120},
            ],
            "connections": [
                {"from": "gateway", "to": "patients", "label": "REST API", "protocol": "HTTPS"},
                {"from": "patients", "to": "database", "label": "Read / write", "protocol": "SQL"},
            ],
        }

    def test_save_and_load_project_architecture(self):
        saved = self.client.put(self.url, self.payload(), format="json")
        self.assertEqual(saved.status_code, 200, saved.content)
        self.assertEqual(ArchNode.objects.filter(project=self.project).count(), 3)
        self.assertEqual(ArchConnection.objects.filter(project=self.project).count(), 2)

        loaded = self.client.get(self.url)
        self.assertEqual(loaded.status_code, 200)
        self.assertEqual(len(loaded.data["nodes"]), 3)
        self.assertEqual(len(loaded.data["connections"]), 2)
        self.assertEqual(loaded.data["nodes"][1]["label"], "Patient Service")

    def test_saving_again_replaces_previous_topology(self):
        self.client.put(self.url, self.payload(), format="json")
        payload = self.payload()
        payload["nodes"][1]["label"] = "Patient Records Service"
        saved = self.client.put(self.url, payload, format="json")
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(ArchNode.objects.filter(project=self.project).count(), 3)
        self.assertEqual(ArchConnection.objects.filter(project=self.project).count(), 2)
        self.assertTrue(ArchNode.objects.filter(project=self.project, label="Patient Records Service").exists())

    def test_other_user_cannot_read_or_replace_architecture(self):
        self.client.put(self.url, self.payload(), format="json")
        other_client = APIClient()
        other_client.force_authenticate(user=self.other)
        self.assertEqual(other_client.get(self.url).status_code, 404)
        self.assertEqual(other_client.put(self.url, self.payload(), format="json").status_code, 404)

    def test_invalid_node_type_is_rejected_without_deleting_existing_topology(self):
        self.client.put(self.url, self.payload(), format="json")
        invalid = self.payload()
        invalid["nodes"][0]["type"] = "invented"
        response = self.client.put(self.url, invalid, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(ArchNode.objects.filter(project=self.project).count(), 3)

    def test_anonymous_user_is_denied(self):
        anonymous = APIClient()
        self.assertIn(anonymous.get(self.url).status_code, (401, 403))
