from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponse
from django.shortcuts import redirect
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def root(request):
    """API root — send browsers to the React app; keep API discoverable."""
    accept = request.headers.get("Accept", "")
    if "text/html" in accept:
        return redirect("http://127.0.0.1:5173/")
    return HttpResponse(
        "KHIS API is running. Open the app at http://127.0.0.1:5173/ "
        "or API docs at /api/docs/",
        content_type="text/plain",
    )


urlpatterns = [
    path("", root, name="root"),
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.patients.urls")),
    path("api/v1/", include("apps.reports.urls")),
    path("api/v1/", include("apps.analysis.urls")),
    path("api/v1/", include("apps.chat.urls")),
    path("api/v1/", include("apps.notifications.urls")),
    path("api/v1/", include("apps.trackers.urls")),
    path("api/v1/", include("apps.exports.urls")),
    path("api/v1/", include("apps.audit.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
