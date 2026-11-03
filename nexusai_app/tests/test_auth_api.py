import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase

from nexusai_app.models import UserProfile

User = get_user_model()


class SessionAuthApiTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.csrf_token = self._get_csrf_token()

    def _get_csrf_token(self):
        response = self.client.get("/api/auth/csrf/", HTTP_HOST="testserver")
        self.assertEqual(response.status_code, 200)
        return response.json()["csrfToken"]

    def _post_json(self, path, payload, token=None):
        return self.client.post(
            path,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token or self.csrf_token,
            HTTP_HOST="testserver",
        )

    def test_anonymous_user_endpoint_is_unauthorized(self):
        response = self.client.get("/api/auth/me/", HTTP_HOST="testserver")
        self.assertEqual(response.status_code, 401)

    def test_csrf_is_required_for_login(self):
        response = self.client.post(
            "/api/auth/login/",
            data=json.dumps({"email": "x@example.com", "password": "wrong"}),
            content_type="application/json",
            HTTP_HOST="testserver",
        )
        self.assertEqual(response.status_code, 403)

    def test_registration_hashes_password_and_establishes_session(self):
        response = self._post_json("/api/auth/register/", {
            "name": "Test User",
            "email": "test.user@example.com",
            "password": "R0bust-test-password!482",
            "role": "System Architect",
        })
        self.assertEqual(response.status_code, 201, response.content)
        payload = response.json()
        self.assertTrue(payload["success"])
        user = User.objects.get(email="test.user@example.com")
        self.assertTrue(user.check_password("R0bust-test-password!482"))
        self.assertNotEqual(user.password, "R0bust-test-password!482")
        self.assertTrue(UserProfile.objects.filter(user=user).exists())
        current = self.client.get("/api/auth/me/", HTTP_HOST="testserver")
        self.assertEqual(current.status_code, 200)
        self.assertEqual(current.json()["user"]["email"], "test.user@example.com")

    def test_duplicate_email_is_rejected(self):
        User.objects.create_user(
            username="existinguser", email="existing@example.com", password="another-strong-pass!123"
        )
        response = self._post_json("/api/auth/register/", {
            "name": "Existing User",
            "email": "EXISTING@example.com",
            "password": "R0bust-test-password!482",
        })
        self.assertEqual(response.status_code, 409)

    def test_login_invalid_credentials_fails(self):
        response = self._post_json("/api/auth/login/", {
            "email": "nobody@example.com", "password": "wrong-password"
        })
        self.assertEqual(response.status_code, 401)

    def test_login_and_logout_manage_session(self):
        user = User.objects.create_user(
            username="sessionuser", email="sessionuser@example.com", password="R0bust-test-password!482"
        )
        UserProfile.objects.create(user=user, role="System Architect")
        response = self._post_json("/api/auth/login/", {
            "email": "sessionuser@example.com", "password": "R0bust-test-password!482"
        })
        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(response.json()["user"]["isLoggedIn"])
        current = self.client.get("/api/auth/me/", HTTP_HOST="testserver")
        self.assertEqual(current.status_code, 200)

        self.csrf_token = self._get_csrf_token()
        logged_out = self._post_json("/api/auth/logout/", {})
        self.assertEqual(logged_out.status_code, 200)
        current_after_logout = self.client.get("/api/auth/me/", HTTP_HOST="testserver")
        self.assertEqual(current_after_logout.status_code, 401)

    def test_private_django_pages_redirect_anonymous_users(self):
        paths = [
            "/", "/projects/", "/requirements/", "/architecture/", "/database/",
            "/agents/", "/code/", "/quality/", "/tasks/", "/analytics/",
            "/cicd/", "/notifications/", "/settings/", "/showcase/",
        ]
        for path in paths:
            with self.subTest(path=path):
                response = Client(HTTP_HOST="testserver").get(path)
                self.assertEqual(response.status_code, 302)
                self.assertIn("/login/", response["Location"])

    def test_project_api_only_returns_current_users_projects(self):
        from rest_framework.test import APIClient
        from nexusai_app.models import Project

        owner = User.objects.create_user(
            username="owner", email="owner@example.com", password="R0bust-test-password!482"
        )
        other = User.objects.create_user(
            username="other", email="other@example.com", password="R0bust-test-password!482"
        )
        own_project = Project.objects.create(
            name="Owner Project", description="owned", category="Test", owner=owner
        )
        Project.objects.create(
            name="Other Project", description="not owned", category="Test", owner=other
        )
        api_client = APIClient()
        api_client.force_authenticate(user=owner)
        response = api_client.get("/api/projects/", HTTP_HOST="testserver")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.json()], [own_project.pk])

    def test_user_cannot_edit_or_delete_another_users_project(self):
        from rest_framework.test import APIClient
        from nexusai_app.models import Project

        owner = User.objects.create_user(
            username="projectowner",
            email="projectowner@example.com",
            password="Strong-test-password!123",
        )
        other = User.objects.create_user(
            username="projectother",
            email="projectother@example.com",
            password="Strong-test-password!123",
        )

        project = Project.objects.create(
            name="Private Project",
            description="Private",
            category="Test",
            owner=owner,
        )

        client = APIClient()
        client.force_authenticate(user=other)

        edit_response = client.patch(
            f"/api/projects/{project.pk}/",
            {"name": "Hacked Project"},
            format="json",
        )
        self.assertEqual(edit_response.status_code, 404)

        delete_response = client.delete(f"/api/projects/{project.pk}/")
        self.assertEqual(delete_response.status_code, 404)

        project.refresh_from_db()
        self.assertEqual(project.name, "Private Project")

    def test_project_owner_cannot_be_spoofed(self):
        from rest_framework.test import APIClient
        from nexusai_app.models import Project

        owner = User.objects.create_user(
            username="creator",
            email="creator@example.com",
            password="Strong-test-password!123",
        )
        other = User.objects.create_user(
            username="fakeowner",
            email="fakeowner@example.com",
            password="Strong-test-password!123",
        )

        client = APIClient()
        client.force_authenticate(user=owner)

        response = client.post(
            "/api/projects/",
            {
                "name": "Ownership Test",
                "description": "Testing project ownership",
                "category": "Test",
                "owner": other.pk,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.content)

        project = Project.objects.get(name="Ownership Test")
        self.assertEqual(project.owner_id, owner.pk)    

    def test_unauthenticated_django_ai_endpoint_is_rejected(self):
        client = Client()
        response = client.post(
            "/api/ai/analyze-requirements",
            data=json.dumps({"rawPrompt": "example"}),
            content_type="application/json",
            HTTP_HOST="testserver",
        )
        self.assertEqual(response.status_code, 401)
