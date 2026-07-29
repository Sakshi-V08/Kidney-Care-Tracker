from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.services import log_action
from apps.patients.models import Patient
from apps.reports.models import LabReport
from apps.reports.serializers import (
    LabReportListSerializer,
    LabReportSerializer,
    MultiUploadSerializer,
)
from apps.reports.tasks import process_lab_report


class LabReportViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    filterset_fields = ["patient", "status"]
    search_fields = ["original_filename", "hospital_name", "doctor_name"]
    ordering_fields = ["report_date", "created_at"]

    def get_queryset(self):
        user = self.request.user
        qs = LabReport.objects.select_related("patient").prefetch_related("results")
        if user.is_admin_role:
            return qs
        return qs.filter(Q(patient__user=user) | Q(patient__caregivers=user)).distinct()

    def get_serializer_class(self):
        if self.action == "list":
            return LabReportListSerializer
        return LabReportSerializer

    def perform_create(self, serializer):
        report = serializer.save(uploaded_by=self.request.user, original_filename=serializer.validated_data["file"].name)
        report.content_type = getattr(report.file, "content_type", "") or ""
        report.file_hash = report.compute_hash()
        # Duplicate detection
        dup = (
            LabReport.objects.filter(patient=report.patient, file_hash=report.file_hash)
            .exclude(pk=report.pk)
            .first()
        )
        if dup:
            report.status = LabReport.Status.DUPLICATE
            report.processing_error = f"Duplicate of report #{dup.id}"
            report.save()
            log_action(
                user=self.request.user,
                action="report.duplicate",
                details={"report_id": report.id, "duplicate_of": dup.id},
            )
            return
        report.save()
        log_action(user=self.request.user, action="report.upload", details={"report_id": report.id})
        process_lab_report.delay(report.id)

    @action(detail=True, methods=["post"])
    def reprocess(self, request, pk=None):
        report = self.get_object()
        report.status = LabReport.Status.PENDING
        report.save(update_fields=["status"])
        process_lab_report.delay(report.id)
        return Response({"detail": "Reprocessing queued", "id": report.id})


class MultiUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = MultiUploadSerializer(data=request.data)
        # files come as request.FILES.getlist
        files = request.FILES.getlist("files") or request.FILES.getlist("file")
        patient_id = request.data.get("patient")
        if not patient_id or not files:
            return Response(
                {"detail": "patient and files are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            patient = Patient.objects.get(pk=patient_id)
        except Patient.DoesNotExist:
            return Response({"detail": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not user.is_admin_role and patient.user_id != user.id and not patient.caregivers.filter(id=user.id).exists():
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        patient.ensure_storage_folder()
        created = []
        for f in files:
            report = LabReport(
                patient=patient,
                original_filename=f.name,
                file=f,
                uploaded_by=user,
                content_type=getattr(f, "content_type", "") or "",
            )
            report.save()
            report.file_hash = report.compute_hash()
            dup = (
                LabReport.objects.filter(patient=patient, file_hash=report.file_hash)
                .exclude(pk=report.pk)
                .first()
            )
            if dup:
                report.status = LabReport.Status.DUPLICATE
                report.processing_error = f"Duplicate of report #{dup.id}"
                report.save()
            else:
                report.save(update_fields=["file_hash"])
                process_lab_report.delay(report.id)
            created.append(LabReportListSerializer(report).data)

        log_action(
            user=user,
            action="report.multi_upload",
            details={"patient_id": patient.id, "count": len(created)},
        )
        return Response({"uploaded": created}, status=status.HTTP_201_CREATED)
