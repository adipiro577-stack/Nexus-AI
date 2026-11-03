"""Require staff users to re-enter their password before Django Admin access.

The separate re-authentication marker is stored in the existing Django session,
so this does not log the user out of the main NexusAI application.
"""
import time
from urllib.parse import urlencode

from django.shortcuts import redirect
from django.urls import reverse

ADMIN_REAUTH_SESSION_KEY = "nexus_admin_reauthenticated_at"
ADMIN_REAUTH_TIMEOUT_SECONDS = 300  # Five minutes of inactivity.


class AdminReauthenticationMiddleware:
    """Gate authenticated staff access to /admin/ behind recent password proof."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path_info
        public_admin_paths = {"/admin/login/", "/admin/logout/"}

        if path.startswith("/admin/") and path not in public_admin_paths:
            user = getattr(request, "user", None)
            if user is not None and user.is_authenticated and user.is_staff:
                now = time.time()
                last_verified = request.session.get(ADMIN_REAUTH_SESSION_KEY)
                try:
                    is_recent = last_verified is not None and 0 <= now - float(last_verified) < ADMIN_REAUTH_TIMEOUT_SECONDS
                except (TypeError, ValueError):
                    is_recent = False

                if not is_recent:
                    request.session.pop(ADMIN_REAUTH_SESSION_KEY, None)
                    destination = request.get_full_path()
                    query = urlencode({"next": destination})
                    return redirect(f"{reverse('admin_reauth')}?{query}")

                # Sliding idle timeout while an authorized admin is actively working.
                request.session[ADMIN_REAUTH_SESSION_KEY] = now

        return self.get_response(request)
