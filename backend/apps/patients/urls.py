from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MyDashboardView, PatientViewSet, UpcomingTestViewSet

router = DefaultRouter()
router.register("patients", PatientViewSet, basename="patient")
router.register("upcoming-tests", UpcomingTestViewSet, basename="upcoming-test")

urlpatterns = [
    path("dashboard/", MyDashboardView.as_view(), name="my-dashboard"),
    path("", include(router.urls)),
]
