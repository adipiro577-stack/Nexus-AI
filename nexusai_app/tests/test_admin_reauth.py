import time

from django.contrib.auth import get_user_model
from django.test import TestCase

from nexusai_app.middleware import ADMIN_REAUTH_SESSION_KEY

User = get_user_model()


class AdminReauthenticationTests(TestCase):
    password = "Strong-admin-password!482"

    def setUp(self):
        self.staff = User.objects.create_user(
            username="nexusadmin",
            email="nexusadmin@example.com",
            password=self.password,
            is_staff=True,
        )
        self.client.force_login(self.staff)

    def test_direct_admin_access_requires_password_confirmation(self):
        response = self.client.get("/admin/")
        self.assertEqual(response.status_code, 302)
        self.assertIn("/admin-access/", response["Location"])

    def test_opening_reauth_page_clears_previous_unlock(self):
        session = self.client.session
        session[ADMIN_REAUTH_SESSION_KEY] = time.time()
        session.save()

        response = self.client.get("/admin-access/")

        self.assertEqual(response.status_code, 200)
        self.assertNotIn(ADMIN_REAUTH_SESSION_KEY, self.client.session)

    def test_wrong_password_does_not_unlock_admin_or_log_out_main_app(self):
        response = self.client.post("/admin-access/", {
            "admin_reauth_password": "incorrect-password",
            "next": "/admin/",
        })

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Incorrect password")
        self.assertIn("_auth_user_id", self.client.session)
        self.assertNotIn(ADMIN_REAUTH_SESSION_KEY, self.client.session)

    def test_correct_password_unlocks_admin_without_logging_out_main_app(self):
        response = self.client.post("/admin-access/", {
            "admin_reauth_password": self.password,
            "next": "/admin/",
        })

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "/admin/")
        self.assertIn(ADMIN_REAUTH_SESSION_KEY, self.client.session)
        self.assertIn("_auth_user_id", self.client.session)

        admin_response = self.client.get("/admin/")
        self.assertEqual(admin_response.status_code, 200)

    def test_non_staff_user_cannot_unlock_admin(self):
        regular_user = User.objects.create_user(
            username="regularuser",
            email="regular@example.com",
            password=self.password,
            is_staff=False,
        )
        self.client.force_login(regular_user)

        response = self.client.get("/admin-access/")

        self.assertEqual(response.status_code, 403)

    def test_expired_unlock_requires_password_again(self):
        session = self.client.session
        session[ADMIN_REAUTH_SESSION_KEY] = time.time() - 301
        session.save()

        response = self.client.get("/admin/")

        self.assertEqual(response.status_code, 302)
        self.assertIn("/admin-access/", response["Location"])
