import json
from json import JSONDecodeError

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.crypto import get_random_string
from django.utils.text import slugify
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from django.core.validators import validate_email

from .models import UserProfile

DISPLAY_ROLES = {
    "System Architect",
    "Lead Software Engineer",
    "DevOps & Security Specialist",
    "Product Owner",
}


def _payload(request):
    try:
        data = json.loads(request.body or b"{}")
    except (JSONDecodeError, UnicodeDecodeError):
        return None, JsonResponse(
            {"success": False, "error": "Request body must contain valid JSON."},
            status=400,
        )
    if not isinstance(data, dict):
        return None, JsonResponse(
            {"success": False, "error": "Request body must be a JSON object."},
            status=400,
        )
    return data, None


def _user_data(user):
    try:
        profile = user.profile
        role = profile.role
        team_role = profile.team_role
    except UserProfile.DoesNotExist:
        role = "Administrator" if user.is_staff else "System Architect"
        team_role = "Admin" if user.is_staff else "Architect"

    name = user.get_full_name().strip() or user.username
    return {
        "id": user.pk,
        "name": name,
        "email": user.email,
        "role": role,
        "teamRole": team_role,
        "isLoggedIn": True,
        "isAdmin": bool(user.is_staff or user.is_superuser),
    }


def _json_error(message, status=400):
    response = JsonResponse({"success": False, "error": message}, status=status)
    response["Cache-Control"] = "no-store"
    return response


@ensure_csrf_cookie
@require_GET
def csrf_token(request):
    """Return a CSRF token for same-origin requests forwarded through Express."""
    response = JsonResponse({"success": True, "csrfToken": get_token(request)})
    response["Cache-Control"] = "no-store"
    return response


@require_GET
def current_user(request):
    if not request.user.is_authenticated:
        return _json_error("Authentication required.", status=401)
    response = JsonResponse({"success": True, "user": _user_data(request.user)})
    response["Cache-Control"] = "no-store"
    return response


@require_POST
def register(request):
    data, error_response = _payload(request)
    if error_response:
        return error_response

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password")
    requested_role = str(data.get("role", "System Architect")).strip()
    role = requested_role if requested_role in DISPLAY_ROLES else "System Architect"

    if not name or not email or not isinstance(password, str) or not password:
        return _json_error("Name, email, and password are required.")
    if len(name) > 150:
        return _json_error("Name must be 150 characters or fewer.")
    try:
        validate_email(email)
    except ValidationError:
        return _json_error("Enter a valid email address.")

    if User.objects.filter(email__iexact=email).exists():
        return _json_error("An account with this email already exists. Please sign in.", status=409)

    base = slugify(email.split("@", 1)[0])[:110] or "nexususer"
    username = f"{base}_{get_random_string(8)}"
    pending_user = User(username=username, email=email, first_name=name)
    try:
        validate_password(password, user=pending_user)
    except ValidationError as exc:
        return _json_error(" ".join(exc.messages))

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=name,
            )
            UserProfile.objects.create(user=user, role=role, team_role="Architect")
    except IntegrityError:
        return _json_error("Unable to create this account. Please try again.", status=409)

    # New registrations are always ordinary users. Display role is not a permission.
    login(request, user)
    response = JsonResponse({"success": True, "user": _user_data(user)}, status=201)
    response["Cache-Control"] = "no-store"
    return response


@require_POST
def login_user(request):
    data, error_response = _payload(request)
    if error_response:
        return error_response

    email = str(data.get("email", "")).strip().lower()
    password = data.get("password")
    if not email or not isinstance(password, str) or not password:
        return _json_error("Email and password are required.")

    candidate = User.objects.filter(email__iexact=email).order_by("pk").first()
    if candidate is None:
        # Compatibility for existing Django accounts whose username is their email.
        candidate = User.objects.filter(username__iexact=email).order_by("pk").first()
    user = None
    if candidate is not None:
        user = authenticate(request, username=candidate.username, password=password)

    if user is None:
        return _json_error("Invalid email or password.", status=401)

    login(request, user)
    response = JsonResponse({"success": True, "user": _user_data(user)})
    response["Cache-Control"] = "no-store"
    return response


@require_POST
def logout_user(request):
    logout(request)
    response = JsonResponse({"success": True, "message": "Signed out successfully."})
    response["Cache-Control"] = "no-store"
    return response
