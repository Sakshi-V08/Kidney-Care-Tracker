from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LabReportViewSet, MultiUploadView

router = DefaultRouter()
router.register("reports", LabReportViewSet, basename="report")

urlpatterns = [
    path("reports/upload/", MultiUploadView.as_view(), name="report-multi-upload"),
    path("", include(router.urls)),
]
