from .models import AuditLog


def log_action(user=None, action="", details=None, request=None):
    ip = None
    ua = ""
    if request is not None:
        ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR"))
        if ip and "," in ip:
            ip = ip.split(",")[0].strip()
        ua = (request.META.get("HTTP_USER_AGENT") or "")[:255]
        if user is None and hasattr(request, "user") and request.user.is_authenticated:
            user = request.user
    return AuditLog.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        action=action,
        details=details or {},
        ip_address=ip,
        user_agent=ua,
    )
