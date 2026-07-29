from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AppointmentViewSet,
    BPViewSet,
    DietPlanViewSet,
    MedicineViewSet,
    WaterViewSet,
    WeightViewSet,
)

router = DefaultRouter()
router.register("trackers/bp", BPViewSet, basename="bp")
router.register("trackers/weight", WeightViewSet, basename="weight")
router.register("trackers/water", WaterViewSet, basename="water")
router.register("trackers/medicines", MedicineViewSet, basename="medicine")
router.register("trackers/appointments", AppointmentViewSet, basename="appointment")
router.register("trackers/diet", DietPlanViewSet, basename="diet")

urlpatterns = [path("", include(router.urls))]
