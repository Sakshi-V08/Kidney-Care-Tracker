from django.conf import settings
from django.db.models import Q
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminRole, IsPatientOwnerOrAdmin
from apps.analysis.services.scoring import build_dashboard_payload
from apps.audit.services import log_action

from .models import Patient, UpcomingTest
from .serializers import PatientListSerializer, PatientSerializer, UpcomingTestSerializer


class PatientViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ["full_name", "folder_name"]
    ordering_fields = ["full_name", "updated_at", "kidney_score"]

    def get_queryset(self):
        user = self.request.user
        qs = Patient.objects.filter(is_active=True).prefetch_related("upcoming_tests", "reports")
        if user.is_admin_role:
            return qs
        return qs.filter(Q(user=user) | Q(caregivers=user)).distinct()

    def get_serializer_class(self):
        if self.action == "list":
            return PatientListSerializer
        return PatientSerializer

    def perform_create(self, serializer):
        user = self.request.user
        patient = serializer.save(user=user if user.is_patient_role else serializer.validated_data.get("user"))
        patient.ensure_storage_folder()
        log_action(user=user, action="patient.create", details={"patient_id": patient.id})

    def perform_update(self, serializer):
        patient = serializer.save()
        log_action(user=self.request.user, action="patient.update", details={"patient_id": patient.id})

    @action(detail=True, methods=["get"])
    def folder(self, request, pk=None):
        patient = self.get_object()
        path = patient.ensure_storage_folder()
        files = []
        for f in sorted(path.iterdir()):
            if f.is_file():
                files.append(
                    {
                        "name": f.name,
                        "size": f.stat().st_size,
                        "modified": f.stat().st_mtime,
                    }
                )
        return Response({"folder": patient.folder_name, "path": str(path), "files": files})

    @action(detail=True, methods=["get"])
    def dashboard(self, request, pk=None):
        patient = self.get_object()
        payload = build_dashboard_payload(patient)
        return Response(payload)


class UpcomingTestViewSet(viewsets.ModelViewSet):
    serializer_class = UpcomingTestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = UpcomingTest.objects.select_related("patient")
        if user.is_admin_role:
            return qs
        return qs.filter(Q(patient__user=user) | Q(patient__caregivers=user))

    def perform_create(self, serializer):
        patient_id = self.request.data.get("patient")
        patient = Patient.objects.get(pk=patient_id)
        user = self.request.user
        if not user.is_admin_role and patient.user_id != user.id and not patient.caregivers.filter(id=user.id).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        serializer.save(patient=patient)


class MyDashboardView(APIView):
    def get(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            if request.user.is_admin_role:
                first = Patient.objects.filter(is_active=True).first()
                if not first:
                    return Response(
                        {"detail": "No patients yet.", "disclaimer": settings.MEDICAL_DISCLAIMER},
                        status=status.HTTP_404_NOT_FOUND,
                    )
                patient = first
            else:
                return Response(
                    {"detail": "No patient profile linked to this account."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        return Response(build_dashboard_payload(patient))
