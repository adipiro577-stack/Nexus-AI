import json
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_GET, require_POST
from .models import NotificationItem

@login_required
@require_GET
def notification_list(request):
    qs = NotificationItem.objects.filter(user=request.user).order_by('-created_at')
    items = [{'id': n.id, 'title': n.title, 'message': n.message, 'type': n.notif_type,
              'read': n.read, 'created_at': n.created_at.isoformat()} for n in qs[:100]]
    return JsonResponse({'success': True, 'notifications': items,
                         'unread_count': qs.filter(read=False).count()})

@login_required
@csrf_protect
@require_POST
def mark_notification_read(request):
    try:
        payload = json.loads(request.body or '{}')
        item_id = int(payload.get('id', 0))
    except (ValueError, TypeError, json.JSONDecodeError):
        return JsonResponse({'success': False, 'error': 'Invalid notification ID.'}, status=400)
    updated = NotificationItem.objects.filter(pk=item_id, user=request.user).update(read=True)
    if not updated:
        return JsonResponse({'success': False, 'error': 'Notification not found.'}, status=404)
    return JsonResponse({'success': True})

@login_required
@csrf_protect
@require_POST
def mark_all_notifications_read(request):
    NotificationItem.objects.filter(user=request.user, read=False).update(read=True)
    return JsonResponse({'success': True})
