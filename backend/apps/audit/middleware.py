from .services import log_action


class AuditMiddleware:
    """Lightweight request audit for mutating API calls."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith("/api/") and request.method in ("POST", "PUT", "PATCH", "DELETE"):
            if getattr(request, "user", None) and request.user.is_authenticated:
                # Avoid double-logging highly specific actions that already log
                if not any(
                    x in request.path
                    for x in ("/auth/login", "/auth/register", "/chat/", "/reports/upload")
                ):
                    try:
                        log_action(
                            user=request.user,
                            action=f"http.{request.method.lower()}",
                            details={"path": request.path, "status": response.status_code},
                            request=request,
                        )
                    except Exception:
                        pass
        return response
