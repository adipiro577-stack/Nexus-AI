import json
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import SystemSetting

DEFAULTS = {
    "provider": "Google Gemini",
    "model": "gemini-2.5-flash",
    "temperature": 0.7,
    "max_tokens": 4096,
}

def _key(user_id, name):
    return f"user:{user_id}:settings:{name}"

def _load(user):
    result = dict(DEFAULTS)
    for name in DEFAULTS:
        row = SystemSetting.objects.filter(key=_key(user.pk, name)).only("value").first()
        if row is not None:
            try:
                result[name] = json.loads(row.value)
            except (TypeError, ValueError):
                result[name] = row.value
    return result

@login_required
@require_http_methods(["GET", "POST"])
def user_settings(request):
    if request.method == "GET":
        return JsonResponse({"success": True, "settings": _load(request.user)})
    try:
        payload = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"success": False, "detail": "Invalid JSON body."}, status=400)
    if not isinstance(payload, dict):
        return JsonResponse({"success": False, "detail": "Settings must be a JSON object."}, status=400)
    provider = str(payload.get("provider", DEFAULTS["provider"])).strip()
    model = str(payload.get("model", DEFAULTS["model"])).strip()
    try:
        temperature = float(payload.get("temperature", DEFAULTS["temperature"]))
        max_tokens = int(payload.get("max_tokens", DEFAULTS["max_tokens"]))
    except (TypeError, ValueError):
        return JsonResponse({"success": False, "detail": "Temperature and max_tokens must be numeric."}, status=400)
    if provider not in {"Google Gemini", "NVIDIA", "Groq", "Mistral", "OpenRouter", "Ollama"}:
        return JsonResponse({"success": False, "detail": "Unsupported provider."}, status=400)
    if not model or len(model) > 120 or not 0 <= temperature <= 2 or not 256 <= max_tokens <= 32768:
        return JsonResponse({"success": False, "detail": "Model, temperature, or token limit is outside the allowed range."}, status=400)
    values = {"provider": provider, "model": model, "temperature": temperature, "max_tokens": max_tokens}
    for name, value in values.items():
        SystemSetting.objects.update_or_create(key=_key(request.user.pk, name), defaults={"value": json.dumps(value)})
    return JsonResponse({"success": True, "settings": _load(request.user)})
