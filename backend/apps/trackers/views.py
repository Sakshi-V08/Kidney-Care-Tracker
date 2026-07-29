from django.db.models import Q
from rest_framework import permissions, serializers, viewsets

from apps.patients.models import Patient

from .models import (
    AppointmentReminder,
    BloodPressureEntry,
    DietPlan,
    MedicineReminder,
    WaterIntakeEntry,
    WeightEntry,
)


class BPSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodPressureEntry
        fields = "__all__"


class WeightSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightEntry
        fields = "__all__"


class WaterSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterIntakeEntry
        fields = "__all__"


class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicineReminder
        fields = "__all__"


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentReminder
        fields = "__all__"


class DietPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = DietPlan
        fields = "__all__"


def patient_scoped(qs, user, patient_field="patient"):
    if user.is_admin_role:
        return qs
    return qs.filter(
        Q(**{f"{patient_field}__user": user}) | Q(**{f"{patient_field}__caregivers": user})
    ).distinct()


class PatientScopedMixin:
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return patient_scoped(super().get_queryset(), self.request.user)


class BPViewSet(PatientScopedMixin, viewsets.ModelViewSet):
    queryset = BloodPressureEntry.objects.select_related("patient")
    serializer_class = BPSerializer


class WeightViewSet(PatientScopedMixin, viewsets.ModelViewSet):
    queryset = WeightEntry.objects.select_related("patient")
    serializer_class = WeightSerializer


class WaterViewSet(PatientScopedMixin, viewsets.ModelViewSet):
    queryset = WaterIntakeEntry.objects.select_related("patient")
    serializer_class = WaterSerializer


class MedicineViewSet(PatientScopedMixin, viewsets.ModelViewSet):
    queryset = MedicineReminder.objects.select_related("patient")
    serializer_class = MedicineSerializer


class AppointmentViewSet(PatientScopedMixin, viewsets.ModelViewSet):
    queryset = AppointmentReminder.objects.select_related("patient")
    serializer_class = AppointmentSerializer


class DietPlanViewSet(PatientScopedMixin, viewsets.ModelViewSet):
    queryset = DietPlan.objects.select_related("patient")
    serializer_class = DietPlanSerializer
