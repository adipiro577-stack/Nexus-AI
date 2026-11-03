from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "online", "version": "1.0.0"})